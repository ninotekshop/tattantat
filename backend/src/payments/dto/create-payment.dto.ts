import { IsIn, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId!: string;

  /** COD is the only client-selectable method until a gateway adapter and its
   * signed callback are configured. */
  @IsIn(['COD'])
  method!: 'COD';
}
