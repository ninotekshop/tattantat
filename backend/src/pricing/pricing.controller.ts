import { Controller, Get, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('order-preview')
  async preview(@Query('productId') productId: string, @Query('quantity') quantity?: string) {
    // Shipping and gateway fees are backend-owned; clients cannot inject either amount.
    const quote = await this.pricing.preview(productId, quantity === undefined ? 1 : Number(quantity));
    return { success: true, data: this.pricing.serializeQuote(quote), message: null, errorCode: null };
  }
}
