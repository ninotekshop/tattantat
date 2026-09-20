import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Req() request: { user: { id: string } }, @Body() body: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined) {
    return this.payments.create(request.user.id, body, idempotencyKey);
  }
}
