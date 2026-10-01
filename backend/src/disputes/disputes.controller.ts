import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { DISPUTE_REASONS, DisputesService } from './disputes.service';

class OpenDisputeDto {
  @IsString() @MaxLength(40) reason!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsOptional() @IsArray() evidence?: string[];
}
class ReplyDto { @IsString() @MaxLength(2000) content!: string; }
class ResolveDto {
  @IsString() @MaxLength(20) decision!: string;
  @IsOptional() @IsString() @MaxLength(20) amount?: string;
  @IsString() @MaxLength(1000) note!: string;
}
type Req_ = { user: { id: string } };
const ok = (data: unknown, message: string | null = null) => ({ success: true, data, message, errorCode: null });

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderDisputesController {
  constructor(private readonly disputes: DisputesService) {}
  @Get(':id/dispute') async get(@Req() r: Req_, @Param('id') id: string) { return ok(await this.disputes.forOrder(r.user.id, id)); }
  @Post(':id/dispute') async open(@Req() r: Req_, @Param('id') id: string, @Body() dto: OpenDisputeDto) { return ok(await this.disputes.open(r.user.id, id, dto), 'Đã gửi khiếu nại. Quản trị viên sẽ xem xét sớm.'); }
  @Post(':id/dispute/messages') async reply(@Req() r: Req_, @Param('id') id: string, @Body() dto: ReplyDto) { return ok(await this.disputes.reply(r.user.id, id, dto.content), 'Đã gửi phản hồi.'); }
}

@Controller('dispute-reasons')
export class DisputeReasonsController { @Get() reasons() { return ok(DISPUTE_REASONS); } }

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminDisputesController {
  constructor(private readonly disputes: DisputesService) {}
  @Get() async list(@Query() q: { status?: string; q?: string; page?: string }) { const r = await this.disputes.list(q); return { success: true, data: r.items, meta: r.meta, message: null, errorCode: null }; }
  @Get('stats') async stats() { return ok(await this.disputes.stats()); }
  @Get(':id') async detail(@Param('id') id: string) { return ok(await this.disputes.detail(id)); }
  @Post(':id/review') async review(@Req() r: Req_, @Param('id') id: string) { return ok(await this.disputes.review(r.user.id, id), 'Đã tiếp nhận khiếu nại.'); }
  @Post(':id/message') async message(@Req() r: Req_, @Param('id') id: string, @Body() dto: ReplyDto) { return ok(await this.disputes.adminMessage(r.user.id, id, dto.content), 'Đã gửi phản hồi cho hai bên.'); }
  @Post(':id/resolve') async resolve(@Req() r: Req_, @Param('id') id: string, @Body() dto: ResolveDto) {
    const res = await this.disputes.resolve(r.user.id, id, dto);
    const extra = res.manualTransfer ? ' Đơn đã thanh toán trực tuyến: hãy chuyển trả tiền cho người mua qua ngân hàng/cổng thanh toán.' : '';
    return ok(res, `Đã giải quyết khiếu nại.${extra}`);
  }
}
