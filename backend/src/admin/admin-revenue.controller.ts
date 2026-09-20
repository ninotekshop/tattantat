import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { RevenueProjectionService } from './revenue-projection.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminRevenueController {
  constructor(private readonly db: DatabaseService, private readonly projections: RevenueProjectionService) {}

  @Get('revenue')
  async revenue(@Query('from') from?: string, @Query('to') to?: string) {
    const values = [from ?? null, to ?? null];
    const orders = await this.db.query(
      `SELECT COUNT(*)::int AS total_orders,
              COALESCE(SUM(total_amount),0)::text AS gmv,
              COALESCE(SUM(platform_fee_amount),0)::text AS platform_fee,
              COALESCE(SUM(payment_fee_amount),0)::text AS payment_fees,
              COALESCE(SUM(seller_payout_amount),0)::text AS seller_payout
       FROM orders
       WHERE order_status='COMPLETED'
         AND completed_at>=COALESCE($1::timestamptz,'epoch')
         AND completed_at<COALESCE($2::timestamptz,'infinity')`,
      values,
    );
    const ledger = await this.db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN e.account_code='PLATFORM_REVENUE' THEN -e.amount ELSE 0 END),0)::text AS platform_revenue,
         COALESCE(SUM(CASE WHEN e.account_code='PAYMENT_PROCESSING_FEE' THEN -e.amount ELSE 0 END),0)::text AS payment_processing_cost,
         COALESCE(SUM(CASE WHEN e.account_code='PROMOTION_REVENUE' THEN -e.amount ELSE 0 END),0)::text AS promotion_revenue,
         COALESCE(SUM(CASE WHEN e.account_code='SUBSCRIPTION_REVENUE' THEN -e.amount ELSE 0 END),0)::text AS subscription_revenue,
         COALESCE(SUM(CASE WHEN e.account_code='ADVERTISING_REVENUE' THEN -e.amount ELSE 0 END),0)::text AS advertising_revenue,
         COALESCE(SUM(CASE WHEN e.account_code='SHIPPING_MARGIN' THEN -e.amount ELSE 0 END),0)::text AS shipping_margin
       FROM ledger_entries e JOIN ledger_transactions t ON t.id=e.transaction_id
       WHERE t.status='FINALIZED' AND t.finalized_at>=COALESCE($1::timestamptz,'epoch')
         AND t.finalized_at<COALESCE($2::timestamptz,'infinity')`,
      values,
    );
    const refunds = await this.db.query(
      `SELECT COALESCE(SUM(amount),0)::text AS refund_volume FROM refunds
       WHERE status='COMPLETED' AND processed_at>=COALESCE($1::timestamptz,'epoch')
         AND processed_at<COALESCE($2::timestamptz,'infinity')`,
      values,
    );
    const source = ledger.rows[0] as Record<string, string>;
    const amount = (name: string) => BigInt(source[name] ?? '0');
    // Fee reversals from refunds are already posted into these net ledger
    // balances. `refundVolume` is disclosed separately, never deducted again.
    const netRevenue = amount('platform_revenue') + amount('promotion_revenue')
      + amount('subscription_revenue') + amount('advertising_revenue')
      + amount('shipping_margin') - amount('payment_processing_cost');
    return {
      success: true,
      data: { ...orders.rows[0], ...source, refund_volume: refunds.rows[0].refund_volume,
        net_revenue: netRevenue.toString(), currency: 'VND' },
      message: null, errorCode: null,
    };
  }

  @Get('financial-report')
  financialReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenue(from, to);
  }

  /** Rebuild one daily dashboard projection from immutable source records. */
  @Post('financial-report/refresh')
  async refreshDailyReport(@Req() request: { user: { id: string } }, @Body('date') rawDate?: string) {
    const date = rawDate ?? new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('date phải có dạng YYYY-MM-DD');
    }
    const result = await this.projections.refresh(date, request.user.id);
    return { success: true, data: result, message: 'Đã làm mới báo cáo doanh thu ngày', errorCode: null };
  }

  @Get('financial-report/daily')
  async dailyReports(@Query('from') from?: string, @Query('to') to?: string) {
    const reports = await this.db.query(
      `SELECT * FROM platform_revenues
       WHERE revenue_date>=COALESCE($1::date,'epoch') AND revenue_date<=COALESCE($2::date,'infinity')
       ORDER BY revenue_date DESC`, [from ?? null, to ?? null],
    );
    return { success: true, data: reports.rows, message: null, errorCode: null };
  }

  @Get('financial-report.csv')
  async exportCsv(@Query('from') from: string | undefined, @Query('to') to: string | undefined,
    @Res() response: Response) {
    const report = await this.revenue(from, to);
    const data = report.data as Record<string, string | number | null>;
    const columns = Object.keys(data);
    const esc = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = `${columns.join(',')}\r\n${columns.map((column) => esc(data[column])).join(',')}\r\n`;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="tat-tan-tat-financial-report.csv"');
    response.send(`\uFEFF${csv}`);
  }

  @Get('financial-report.xlsx')
  async exportExcel(@Query('from') from: string | undefined, @Query('to') to: string | undefined,
    @Res() response: Response) {
    const report = await this.revenue(from, to);
    const data = report.data as Record<string, string | number | null>;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Financial report');
    sheet.columns = [{ header: 'Metric', key: 'metric', width: 32 }, { header: 'VND', key: 'value', width: 24 }];
    for (const [metric, value] of Object.entries(data)) sheet.addRow({ metric, value: value ?? '0' });
    sheet.getRow(1).font = { bold: true };
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', 'attachment; filename="tat-tan-tat-financial-report.xlsx"');
    response.send(Buffer.from(await workbook.xlsx.writeBuffer()));
  }

  @Get('financial-report.pdf')
  async exportPdf(@Query('from') from: string | undefined, @Query('to') to: string | undefined,
    @Res() response: Response) {
    const report = await this.revenue(from, to);
    const data = report.data as Record<string, string | number | null>;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="tat-tan-tat-financial-report.pdf"');
    const document = new PDFDocument({ margin: 48 });
    document.pipe(response);
    document.fontSize(18).text('Tat Tan Tat - Financial Report');
    document.moveDown(0.5).fontSize(10).text(`From: ${from ?? 'beginning'}   To: ${to ?? 'now'}`);
    document.moveDown();
    for (const [metric, value] of Object.entries(data)) document.fontSize(10).text(`${metric}: ${value ?? '0'} VND`);
    document.end();
  }

  @Get('transactions')
  async transactions(
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
    @Query('type') type?: string,
    @Query('orderId') orderId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const page = this.positiveInteger(rawPage, 1, 1_000_000, 'page');
    const limit = this.positiveInteger(rawLimit, 50, 200, 'limit');
    const allowedTypes = new Set(['ORDER_PAYMENT', 'PROMOTION_PURCHASE', 'SUBSCRIPTION_PURCHASE',
      'ADVERTISING_PURCHASE', 'PAYOUT', 'REFUND', 'REVERSAL', 'SHIPPING_SETTLEMENT']);
    if (type && !allowedTypes.has(type)) throw new BadRequestException('Loại giao dịch không hợp lệ');
    if (orderId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
      throw new BadRequestException('orderId không hợp lệ');
    }
    this.timestamp(from, 'from'); this.timestamp(to, 'to');
    const where = `WHERE ($1::text IS NULL OR t.type=$1::ledger_transaction_type)
      AND ($2::uuid IS NULL OR t.order_id=$2::uuid)
      AND t.created_at>=COALESCE($3::timestamptz,'epoch')
      AND t.created_at<COALESCE($4::timestamptz,'infinity')`;
    const params = [type ?? null, orderId ?? null, from ?? null, to ?? null, limit, (page - 1) * limit];
    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT t.id,t.type::text,t.order_id,t.payment_id,t.reference_id,t.status::text,t.created_at,t.finalized_at,
          COALESCE(SUM(CASE WHEN e.amount>0 THEN e.amount ELSE 0 END),0)::text AS total_debit,
          COALESCE(SUM(CASE WHEN e.amount<0 THEN -e.amount ELSE 0 END),0)::text AS total_credit,
          COALESCE(SUM(e.amount),0)::text AS balance
         FROM ledger_transactions t LEFT JOIN ledger_entries e ON e.transaction_id=t.id
         ${where}
         GROUP BY t.id ORDER BY t.created_at DESC,t.id DESC LIMIT $5 OFFSET $6`, params),
      this.db.query(`SELECT COUNT(*)::int AS total FROM ledger_transactions t ${where}`, params.slice(0, 4)),
    ]);
    return {
      success: true, data: items.rows,
      meta: { page, limit, total: count.rows[0].total }, message: null, errorCode: null,
    };
  }

  private positiveInteger(value: string | undefined, fallback: number, maximum: number, field: string): number {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new BadRequestException(`${field} không hợp lệ`);
    return parsed;
  }

  private timestamp(value: string | undefined, field: string): void {
    if (value !== undefined && Number.isNaN(Date.parse(value))) throw new BadRequestException(`${field} không hợp lệ`);
  }
}
