import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { decimalToVnd, money, proportionalRound } from '../finance/finance-money';

export interface PricingQuote {
  pricingVersionId: string | null;
  platformFeeRateBps: number;
  subtotal: bigint;
  discountAmount: bigint;
  shippingFee: bigint;
  paymentFee: bigint;
  platformFee: bigint;
  buyerTotal: bigint;
  sellerPayout: bigint;
  netPlatformRevenue: bigint;
}

@Injectable()
export class PricingService {
  constructor(private readonly db: DatabaseService) {}

  /** Computes only with integer VND. serializeQuote converts bigint at HTTP boundaries. */
  async preview(productId: string, quantity = 1, shippingFee = 0n, paymentFee = 0n): Promise<PricingQuote> {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000) {
      throw new BadRequestException('quantity phải là số nguyên từ 1 đến 1000');
    }
    if (shippingFee < 0n || paymentFee < 0n) throw new BadRequestException('Phí không được âm');

    const product = await this.db.query<{ price: string; listing_price_mode?: string }>(
      'SELECT price::text,listing_price_mode FROM products WHERE id=$1 AND status=$2',
      [productId, 'ACTIVE'],
    );
    if (!product.rows[0]) throw new NotFoundException('Không tìm thấy sản phẩm đang bán');
    if (product.rows[0].listing_price_mode && product.rows[0].listing_price_mode !== 'FIXED') throw new BadRequestException('Tin này cần trao đổi với người bán, không áp dụng thanh toán giá cố định.');

    const activeRule = await this.db.query<{ id: string; rate_bps: number }>(
      `SELECT v.id, v.rate_bps FROM pricing_versions v JOIN pricing_rules r ON r.id=v.rule_id
       WHERE r.code=$1 AND r.status='ACTIVE' AND v.effective_from<=NOW()
         AND (v.effective_to IS NULL OR v.effective_to>NOW())
       ORDER BY v.effective_from DESC LIMIT 1`,
      ['STANDARD_MARKETPLACE_FEE'],
    );
    const unitPrice = decimalToVnd(product.rows[0].price, 'Giá sản phẩm');
    const subtotal = unitPrice * BigInt(quantity);
    const platformFeeRateBps = activeRule.rows[0]?.rate_bps ?? 0;
    const platformFee = proportionalRound(subtotal, BigInt(platformFeeRateBps), 10_000n);
    const sellerPayout = subtotal - platformFee - paymentFee;
    if (sellerPayout < 0n) throw new BadRequestException('Phí thanh toán vượt giá trị đơn hàng');

    return {
      pricingVersionId: activeRule.rows[0]?.id ?? null,
      platformFeeRateBps,
      subtotal,
      discountAmount: 0n,
      shippingFee,
      paymentFee,
      platformFee,
      buyerTotal: subtotal + shippingFee,
      sellerPayout,
      netPlatformRevenue: platformFee - paymentFee,
    };
  }

  serializeQuote(quote: PricingQuote) {
    const snapshot = {
      pricingVersionId: quote.pricingVersionId,
      platformFeeRateBps: quote.platformFeeRateBps,
      subtotal: money(quote.subtotal),
      discountAmount: money(quote.discountAmount),
      shippingFee: money(quote.shippingFee),
      paymentFee: money(quote.paymentFee),
      platformFee: money(quote.platformFee),
      buyerTotal: money(quote.buyerTotal),
      sellerPayout: money(quote.sellerPayout),
      netPlatformRevenue: money(quote.netPlatformRevenue),
      currency: 'VND',
    };
    return { ...snapshot, quoteFingerprint: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') };
  }
}
