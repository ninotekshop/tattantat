import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class ReconciliationController {
  constructor(private readonly db: DatabaseService) {}

  @Get('reconciliation')
  async check() {
    const [result, summary] = await Promise.all([
      this.db.query(
      `SELECT t.id,t.type,t.order_id,COUNT(e.id)::int AS entry_count,COALESCE(SUM(e.amount),0)::text AS balance
       FROM ledger_transactions t LEFT JOIN ledger_entries e ON e.transaction_id=t.id
       WHERE t.status='FINALIZED' GROUP BY t.id
       HAVING COUNT(e.id)<2 OR COALESCE(SUM(e.amount),0)<>0
       ORDER BY t.id LIMIT 500`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS finalized_transactions,COALESCE(SUM(CASE WHEN e.amount>0 THEN e.amount ELSE 0 END),0)::text AS total_debits,
                COALESCE(SUM(CASE WHEN e.amount<0 THEN -e.amount ELSE 0 END),0)::text AS total_credits
         FROM ledger_transactions t LEFT JOIN ledger_entries e ON e.transaction_id=t.id WHERE t.status='FINALIZED'`,
      ),
    ]);
    return {
      success: true,
      data: { balanced: result.rows.length === 0, checked: summary.rows[0], errors: result.rows },
      message: null, errorCode: null,
    };
  }
}
