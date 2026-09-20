import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class FinancialAuditController {
  constructor(private readonly db: DatabaseService) {}

  @Get('financial-audit-logs')
  async list(@Query('entityType') entityType?: string, @Query('limit') rawLimit?: string) {
    const requested = Number(rawLimit ?? 100);
    const limit = Number.isSafeInteger(requested) ? Math.min(Math.max(requested, 1), 500) : 100;
    const result = await this.db.query(
      `SELECT id,actor_id,action,entity_type,entity_id,old_value,new_value,reason,created_at
       FROM financial_audit_logs
       WHERE ($1::text IS NULL OR entity_type=$1)
       ORDER BY created_at DESC LIMIT $2`,
      [entityType?.trim() || null, limit],
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }
}
