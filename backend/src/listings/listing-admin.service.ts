import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ListingsService } from './listings.service';
import type { Field, Template } from './listing-domain';

const envelope = <T>(data: T) => ({ success: true, data, message: null, errorCode: null });
const CATEGORY_STATUS = ['ACTIVE', 'HIDDEN'];
export type CategoryPatch = { name?: string; status?: string; sortOrder?: number; iconUrl?: string | null; description?: string | null };

/** Quản trị danh mục & lịch sử biểu mẫu. Mọi thay đổi đều ghi nhật ký; không xóa cứng dữ liệu. */
@Injectable()
export class ListingAdminService {
  constructor(private readonly db: DatabaseService, private readonly listings: ListingsService) {}

  async tree() {
    const rows = (await this.db.query(`SELECT c.id::text, c.parent_id::text AS "parentId", c.name, c.slug, c.description, c.icon_url AS "iconUrl",
        c.sort_order AS "sortOrder", c.status, c.is_listing_group AS "isGroup",
        t.version AS "templateVersion", (t.id IS NOT NULL) AS "hasTemplate", (t.created_by IS NOT NULL) AS "editedByAdmin",
        COALESCE((SELECT count(*) FROM listing_fields f WHERE f.template_id=t.id),0)::int AS "fieldCount",
        (SELECT count(*) FROM listings l WHERE l.category_id=c.id AND l.status='PUBLISHED')::int AS "listingCount"
      FROM categories c LEFT JOIN listing_templates t ON t.category_id=c.id AND t.active
      ORDER BY c.parent_id NULLS FIRST, c.sort_order, c.name`)).rows;
    return envelope(rows);
  }

  /** Biểu mẫu áp dụng cho danh mục, kèm thông tin có phải kế thừa từ danh mục cha không. */
  async template(categoryId: string) {
    const template: Template = await this.listings.template(categoryId);
    const own = (await this.db.query('SELECT 1 FROM listing_templates t WHERE t.category_id=$1 AND t.active AND EXISTS(SELECT 1 FROM listing_fields f WHERE f.template_id=t.id)', [categoryId])).rows.length > 0;
    return envelope({ template, inherited: !own });
  }

  async updateCategory(actorId: string, id: string, patch: CategoryPatch) {
    return this.db.transaction(async client => {
      const current = (await client.query('SELECT id::text, parent_id::text AS "parentId", status FROM categories WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!current) throw new NotFoundException('Danh mục không tồn tại.');
      const sets: string[] = []; const values: unknown[] = [id];
      const set = (column: string, value: unknown) => { values.push(value); sets.push(`${column}=$${values.length}`); };
      if (patch.name !== undefined) {
        const name = patch.name.trim();
        if (!name || name.length > 100) throw new BadRequestException('Tên danh mục không hợp lệ (1–100 ký tự).');
        const clash = await client.query('SELECT 1 FROM categories WHERE parent_id IS NOT DISTINCT FROM $1::bigint AND name=$2 AND id<>$3', [current.parentId, name, id]);
        if (clash.rows.length) throw new ConflictException('Đã có danh mục cùng tên ở cùng cấp.');
        set('name', name);
      }
      if (patch.sortOrder !== undefined) {
        if (!Number.isInteger(patch.sortOrder) || patch.sortOrder < 0 || patch.sortOrder > 100000) throw new BadRequestException('Thứ tự không hợp lệ.');
        set('sort_order', patch.sortOrder);
      }
      if (patch.iconUrl !== undefined) {
        const url = patch.iconUrl?.trim() || null;
        if (url && (url.length > 500 || !/^(https?:\/\/|\/)[^\s<>"']+$/.test(url))) throw new BadRequestException('Đường dẫn biểu tượng không hợp lệ.');
        set('icon_url', url);
      }
      if (patch.description !== undefined) {
        const text = patch.description?.trim() || null;
        if (text && text.length > 500) throw new BadRequestException('Mô tả tối đa 500 ký tự.');
        set('description', text);
      }
      if (sets.length) await client.query(`UPDATE categories SET ${sets.join(',')}, updated_at=now() WHERE id=$1`, values);
      if (patch.status !== undefined) {
        if (!CATEGORY_STATUS.includes(patch.status)) throw new BadRequestException('Trạng thái danh mục không hợp lệ.');
        if (patch.status === 'ACTIVE' && current.parentId) {
          const parent = (await client.query('SELECT status FROM categories WHERE id=$1', [current.parentId])).rows[0];
          if (parent && parent.status !== 'ACTIVE') throw new BadRequestException('Hãy hiện danh mục cha trước.');
        }
        // Ẩn/hiện danh mục cha áp dụng cho toàn bộ danh mục con để cây danh mục luôn nhất quán.
        await client.query(`WITH RECURSIVE sub AS (SELECT id FROM categories WHERE id=$1 UNION ALL SELECT c.id FROM categories c JOIN sub s ON c.parent_id=s.id)
          UPDATE categories SET status=$2, updated_at=now() WHERE id IN (SELECT id FROM sub)`, [id, patch.status]);
      }
      await client.query('INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4::jsonb)', [actorId, 'CATEGORY_UPDATED', id, JSON.stringify(patch)]);
      return envelope({ id });
    });
  }

  async reorder(actorId: string, items: { id: string; sortOrder: number }[]) {
    if (!Array.isArray(items) || !items.length || items.length > 300) throw new BadRequestException('Danh sách thứ tự không hợp lệ.');
    for (const item of items) if (!/^\d{1,15}$/.test(String(item.id)) || !Number.isInteger(item.sortOrder) || item.sortOrder < 0 || item.sortOrder > 100000) throw new BadRequestException('Danh sách thứ tự không hợp lệ.');
    await this.db.transaction(async client => {
      await client.query(`UPDATE categories c SET sort_order=x.ord, updated_at=now() FROM jsonb_to_recordset($1::jsonb) AS x(id bigint, ord int) WHERE c.id=x.id`,
        [JSON.stringify(items.map(item => ({ id: item.id, ord: item.sortOrder })))]);
      await client.query('INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4::jsonb)', [actorId, 'CATEGORY_REORDERED', 'bulk', JSON.stringify({ count: items.length })]);
    });
    return envelope({ updated: items.length });
  }

  async versions(categoryId: string) {
    const rows = (await this.db.query(`SELECT t.version, t.name, t.active, t.created_at AS "createdAt", t.created_by IS NOT NULL AS "byAdmin",
        (SELECT count(*) FROM listing_fields f WHERE f.template_id=t.id)::int AS "fieldCount",
        (SELECT a.detail->>'reason' FROM listing_audit_logs a WHERE a.entity_id=t.id::text AND a.action='TEMPLATE_VERSION_CREATED' ORDER BY a.created_at DESC LIMIT 1) AS reason
      FROM listing_templates t WHERE t.category_id=$1 ORDER BY t.version DESC LIMIT 50`, [categoryId])).rows;
    return envelope(rows);
  }

  private async definition(categoryId: string, version: number): Promise<{ name: string; fields: Field[]; config: Template['config'] }> {
    const row = (await this.db.query('SELECT id::text, name, config FROM listing_templates WHERE category_id=$1 AND version=$2', [categoryId, version])).rows[0];
    if (!row) throw new NotFoundException('Không tìm thấy phiên bản biểu mẫu.');
    const fields = (await this.db.query(`SELECT f.key,f.label,f.type,f.required,f.enabled,f.config,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('value',o.value,'label',o.label) ORDER BY o.sort_order) FROM listing_field_options o WHERE o.field_id=f.id),'[]'::jsonb) AS options
      FROM listing_fields f WHERE template_id=$1 ORDER BY sort_order`, [row.id])).rows as Field[];
    return { name: row.name, fields, config: row.config };
  }

  async version(categoryId: string, version: number) {
    return envelope(await this.definition(categoryId, version));
  }

  async restore(actorId: string, categoryId: string, version: number, reason: string) {
    const definition = await this.definition(categoryId, version);
    const note = `Khôi phục từ phiên bản ${version}: ${String(reason ?? '').trim()}`.slice(0, 500);
    return this.listings.adminVersion(actorId, categoryId, { ...definition, reason: note });
  }
}
