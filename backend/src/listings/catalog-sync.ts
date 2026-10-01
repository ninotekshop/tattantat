import { createHash } from 'node:crypto';
import { CATALOG, LEGACY_ELECTRONICS, type GroupSpec, type LeafSpec, type TemplateConfig } from './listing-catalog';
import type { Field } from './listing-domain';

export type Queryable = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }> };
export type SyncReport = { skipped: boolean; hash: string; categoriesCreated: string[]; templatesCreated: number; templatesUpdated: number; templatesKept: number; warnings: string[] };

/** Mã băm nội dung danh mục: đổi catalog => tự đồng bộ lại đúng một lần. */
export function catalogHash(catalog: GroupSpec[] = CATALOG): string {
  return createHash('sha256').update(JSON.stringify([catalog, LEGACY_ELECTRONICS])).digest('hex').slice(0, 16);
}

export async function syncCatalog(client: Queryable, options: { force?: boolean; catalog?: GroupSpec[] } = {}): Promise<SyncReport> {
  const catalog = options.catalog ?? CATALOG;
  const hash = catalogHash(catalog);
  const report: SyncReport = { skipped: false, hash, categoriesCreated: [], templatesCreated: 0, templatesUpdated: 0, templatesKept: 0, warnings: [] };
  await client.query('CREATE TABLE IF NOT EXISTS listing_engine_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('listing-catalog-sync'))");
  const marker = 'catalog-sync-' + hash;
  if (!options.force && (await client.query('SELECT 1 FROM listing_engine_migrations WHERE name=$1', [marker])).rows.length) { report.skipped = true; return report; }

  async function ensureCategory(slug: string, name: string, parentId: string | null, isGroup: boolean, order: number): Promise<string | null> {
    const found = (await client.query('SELECT id::text, is_listing_group FROM categories WHERE slug=$1', [slug])).rows[0];
    if (found) {
      if (isGroup && !found.is_listing_group) await client.query('UPDATE categories SET is_listing_group=true, updated_at=now() WHERE id=$1', [found.id]);
      return found.id;
    }
    const clash = (await client.query('SELECT slug FROM categories WHERE parent_id IS NOT DISTINCT FROM $1::bigint AND name=$2', [parentId, name])).rows[0];
    if (clash) { report.warnings.push(`Bỏ qua "${name}" (${slug}): trùng tên với chuyên mục "${clash.slug}" cùng cấp.`); return null; }
    const created = await client.query('INSERT INTO categories(name,slug,parent_id,is_listing_group,sort_order,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id::text', [name, slug, parentId, isGroup, order, 'ACTIVE']);
    report.categoriesCreated.push(slug);
    return created.rows[0].id;
  }

  async function writeTemplate(categoryId: string, name: string, fields: Field[], config: TemplateConfig) {
    const existing = (await client.query('SELECT id::text, (created_by IS NOT NULL) AS edited FROM listing_templates WHERE category_id=$1 AND active', [categoryId])).rows[0];
    // Biểu mẫu đã được quản trị viên chỉnh sửa là nguồn chuẩn: đồng bộ danh mục mặc định không được ghi đè.
    if (existing?.edited) { report.templatesKept++; return; }
    const nextVersion = `(SELECT COALESCE(max(version),0)+1 FROM listing_templates WHERE category_id=$1)`;
    let templateId: string;
    if (existing) {
      templateId = existing.id;
      await client.query(`UPDATE listing_templates SET name=$2, config=$3::jsonb, version=${nextVersion} WHERE id=$4`, [categoryId, name, JSON.stringify(config), templateId]);
      await client.query('DELETE FROM listing_field_options WHERE field_id IN (SELECT id FROM listing_fields WHERE template_id=$1)', [templateId]);
      await client.query('DELETE FROM listing_fields WHERE template_id=$1', [templateId]);
      report.templatesUpdated++;
    } else {
      templateId = (await client.query(`INSERT INTO listing_templates(category_id,version,name,config) VALUES($1,${nextVersion},$2,$3::jsonb) RETURNING id::text`, [categoryId, name, JSON.stringify(config)])).rows[0].id;
      report.templatesCreated++;
    }
    if (!fields.length) return;
    await client.query(
      `INSERT INTO listing_fields(template_id,key,label,type,required,enabled,sort_order,config)
       SELECT $1::uuid, x.key, x.label, x.type, x.required, x.enabled, x.ord, x.config
       FROM jsonb_to_recordset($2::jsonb) AS x(key text,label text,type text,required boolean,enabled boolean,ord int,config jsonb)`,
      [templateId, JSON.stringify(fields.map((f, ord) => ({ key: f.key, label: f.label, type: f.type, required: f.required, enabled: f.enabled, ord, config: f.config })))]);
    const options = fields.flatMap(f => f.options.map((o, ord) => ({ key: f.key, value: o.value, label: o.label, ord })));
    if (options.length) await client.query(
      `INSERT INTO listing_field_options(field_id,value,label,sort_order)
       SELECT f.id, o.value, o.label, o.ord FROM jsonb_to_recordset($2::jsonb) AS o(key text,value text,label text,ord int)
       JOIN listing_fields f ON f.template_id=$1::uuid AND f.key=o.key`, [templateId, JSON.stringify(options)]);
  }

  for (const group of catalog) {
    const groupId = await ensureCategory(group.slug, group.name, null, true, group.order);
    if (!groupId) continue;
    await writeTemplate(groupId, group.name, group.fields, group.config);
    for (const [index, child] of group.children.entries() as IterableIterator<[number, LeafSpec]>) {
      const childId = await ensureCategory(child.slug, child.name, groupId, false, index);
      if (!childId) continue;
      await writeTemplate(childId, child.name, child.fields, { ...group.config, ...child.config } as TemplateConfig);
    }
  }
  // Chuyên mục cũ "Đồ điện tử" (không thuộc nhóm nào) vẫn cần biểu mẫu để không lỗi khi mở.
  const legacy = (await client.query('SELECT id::text FROM categories WHERE slug=$1', [LEGACY_ELECTRONICS.slug])).rows[0];
  if (legacy) await writeTemplate(legacy.id, LEGACY_ELECTRONICS.name, LEGACY_ELECTRONICS.fields, LEGACY_ELECTRONICS.config);

  await client.query('INSERT INTO listing_engine_migrations(name) VALUES($1) ON CONFLICT DO NOTHING', [marker]);
  return report;
}
