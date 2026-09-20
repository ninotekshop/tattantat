import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PoolClient } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

type PromotionVersionInput = { price: string; durationHours: number; promotionType: 'BOOST' | 'FEATURED'; effectiveFrom?: string; reason: string };
type SubscriptionVersionInput = { price: string; billingCycle: 'MONTHLY' | 'YEARLY'; maxListings?: number | null; features?: unknown; effectiveFrom?: string; reason: string };

@Controller('admin')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class ServicePricingAdminController {
  constructor(private readonly db: DatabaseService) {}

  @Get('promotion-packages')
  async promotionPackages() {
    const result = await this.db.query(
      `SELECT p.id,p.code,p.name,p.status,v.id AS version_id,v.price::text,v.duration_hours,v.promotion_type::text,
              v.effective_from,v.effective_to,v.reason
       FROM promotion_packages p LEFT JOIN LATERAL (
         SELECT * FROM promotion_package_versions v WHERE v.package_id=p.id AND v.status='ACTIVE'
           AND v.effective_from<=NOW() AND (v.effective_to IS NULL OR v.effective_to>NOW())
         ORDER BY v.effective_from DESC LIMIT 1
       ) v ON TRUE ORDER BY p.code`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Get('subscription-plans')
  async subscriptionPlans() {
    const result = await this.db.query(
      `SELECT p.id,p.code,p.name,p.status,v.id AS version_id,v.price::text,v.billing_cycle,v.max_listings,v.features,
              v.effective_from,v.effective_to,v.reason
       FROM subscription_plans p LEFT JOIN LATERAL (
         SELECT * FROM subscription_plan_versions v WHERE v.plan_id=p.id AND v.status='ACTIVE'
           AND v.effective_from<=NOW() AND (v.effective_to IS NULL OR v.effective_to>NOW())
         ORDER BY v.effective_from DESC LIMIT 1
       ) v ON TRUE ORDER BY p.code`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Get('promotion-packages/:id/versions')
  async promotionVersions(@Param('id') packageId: string) {
    return this.list('promotion_package_versions', 'package_id', packageId);
  }

  @Get('subscription-plans/:id/versions')
  async subscriptionVersions(@Param('id') planId: string) {
    return this.list('subscription_plan_versions', 'plan_id', planId);
  }

  @Post('promotion-packages')
  async createPromotionPackage(@Req() request: { user: { id: string } }, @Body() body: PromotionVersionInput & { code: string; name: string }) {
    if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(body.code ?? '') || !body.name?.trim()) throw new BadRequestException('Mã hoặc tên gói không hợp lệ');
    return this.db.transaction(async (client) => {
      const packageRow = await client.query<{ id: string }>(
        `INSERT INTO promotion_packages(code,name,price,duration_hours,promotion_type,status,effective_from)
         VALUES($1,$2,0,1,'BOOST','ACTIVE',NOW()) RETURNING id`, [body.code, body.name.trim()]);
      const version = await this.insertPromotionVersion(client, packageRow.rows[0].id, request.user.id, body);
      return { success: true, data: { id: packageRow.rows[0].id, versionId: version.id }, message: 'Đã tạo gói và phiên bản giá đầu tiên', errorCode: null };
    });
  }

  @Post('promotion-packages/:id/versions')
  async createPromotionVersion(@Req() request: { user: { id: string } }, @Param('id') packageId: string, @Body() body: PromotionVersionInput) {
    return this.db.transaction(async (client) => {
      const packageRow = await client.query('SELECT id FROM promotion_packages WHERE id=$1 FOR UPDATE', [packageId]);
      if (!packageRow.rows[0]) throw new BadRequestException('Không tìm thấy gói đẩy tin');
      const version = await this.insertPromotionVersion(client, packageId, request.user.id, body);
      return { success: true, data: version, message: 'Đã tạo phiên bản giá mới', errorCode: null };
    });
  }

  @Post('subscription-plans')
  async createSubscriptionPlan(@Req() request: { user: { id: string } }, @Body() body: SubscriptionVersionInput & { code: string; name: string }) {
    if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(body.code ?? '') || !body.name?.trim()) throw new BadRequestException('Mã hoặc tên gói không hợp lệ');
    return this.db.transaction(async (client) => {
      const plan = await client.query<{ id: string }>(
        `INSERT INTO subscription_plans(code,name,price,billing_cycle,max_listings,features,status,effective_from)
         VALUES($1,$2,0,'MONTHLY',NULL,'[]','ACTIVE',NOW()) RETURNING id`, [body.code, body.name.trim()]);
      const version = await this.insertSubscriptionVersion(client, plan.rows[0].id, request.user.id, body);
      return { success: true, data: { id: plan.rows[0].id, versionId: version.id }, message: 'Đã tạo gói và phiên bản giá đầu tiên', errorCode: null };
    });
  }

  @Post('subscription-plans/:id/versions')
  async createSubscriptionVersion(@Req() request: { user: { id: string } }, @Param('id') planId: string, @Body() body: SubscriptionVersionInput) {
    return this.db.transaction(async (client) => {
      const plan = await client.query('SELECT id FROM subscription_plans WHERE id=$1 FOR UPDATE', [planId]);
      if (!plan.rows[0]) throw new BadRequestException('Không tìm thấy gói shop');
      const version = await this.insertSubscriptionVersion(client, planId, request.user.id, body);
      return { success: true, data: version, message: 'Đã tạo phiên bản giá mới', errorCode: null };
    });
  }

  private async insertPromotionVersion(client: PoolClient, packageId: string, actorId: string, input: PromotionVersionInput) {
    const price = this.money(input.price, 'price');
    if (!Number.isInteger(input.durationHours) || input.durationHours < 1 || input.durationHours > 24 * 366) throw new BadRequestException('durationHours không hợp lệ');
    if (!['BOOST', 'FEATURED'].includes(input.promotionType)) throw new BadRequestException('promotionType không hợp lệ');
    const start = this.date(input.effectiveFrom); const reason = this.reason(input.reason);
    await client.query(
      `UPDATE promotion_package_versions SET effective_to=$2
       WHERE package_id=$1 AND status='ACTIVE' AND effective_from<$2 AND (effective_to IS NULL OR effective_to>$2)`, [packageId, start]);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO promotion_package_versions(package_id,price,duration_hours,promotion_type,effective_from,created_by,reason)
       VALUES($1,$2,$3,$4::promotion_type,$5,$6,$7) RETURNING id`,
      [packageId, price, input.durationHours, input.promotionType, start, actorId, reason]);
    await this.audit(client, actorId, 'PROMOTION_PACKAGE_VERSION_CREATED', 'PROMOTION_PACKAGE', packageId, { versionId: inserted.rows[0].id, price, effectiveFrom: start }, reason);
    return inserted.rows[0];
  }

  private async insertSubscriptionVersion(client: PoolClient, planId: string, actorId: string, input: SubscriptionVersionInput) {
    const price = this.money(input.price, 'price');
    if (!['MONTHLY', 'YEARLY'].includes(input.billingCycle)) throw new BadRequestException('billingCycle không hợp lệ');
    if (input.maxListings !== undefined && input.maxListings !== null && (!Number.isInteger(input.maxListings) || input.maxListings < 1)) throw new BadRequestException('maxListings không hợp lệ');
    const start = this.date(input.effectiveFrom); const reason = this.reason(input.reason);
    const features = input.features ?? [];
    await client.query(
      `UPDATE subscription_plan_versions SET effective_to=$2
       WHERE plan_id=$1 AND status='ACTIVE' AND effective_from<$2 AND (effective_to IS NULL OR effective_to>$2)`, [planId, start]);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO subscription_plan_versions(plan_id,price,billing_cycle,max_listings,features,effective_from,created_by,reason)
       VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING id`,
      [planId, price, input.billingCycle, input.maxListings ?? null, JSON.stringify(features), start, actorId, reason]);
    await this.audit(client, actorId, 'SUBSCRIPTION_PLAN_VERSION_CREATED', 'SUBSCRIPTION_PLAN', planId, { versionId: inserted.rows[0].id, price, effectiveFrom: start }, reason);
    return inserted.rows[0];
  }

  private async list(table: 'promotion_package_versions' | 'subscription_plan_versions', column: 'package_id' | 'plan_id', id: string) {
    const result = await this.db.query(`SELECT * FROM ${table} WHERE ${column}=$1 ORDER BY effective_from DESC,created_at DESC`, [id]);
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  private money(value: string, field: string): string {
    if (!/^(0|[1-9]\d{0,14})$/.test(value ?? '')) throw new BadRequestException(`${field} phải là số tiền VND nguyên không âm`);
    return value;
  }
  private date(value?: string): string {
    if (!value) return new Date().toISOString();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('effectiveFrom không hợp lệ');
    return parsed.toISOString();
  }
  private reason(value: string): string {
    if (!value?.trim() || value.trim().length > 500) throw new BadRequestException('Cần nêu lý do thay đổi giá');
    return value.trim();
  }
  private async audit(client: PoolClient, actorId: string, action: string, entityType: string, entityId: string, newValue: unknown, reason: string) {
    await client.query(`INSERT INTO financial_audit_logs(actor_id,action,entity_type,entity_id,new_value,reason)
      VALUES($1,$2,$3,$4,$5::jsonb,$6)`, [actorId, action, entityType, entityId, JSON.stringify(newValue), reason]);
  }
}
