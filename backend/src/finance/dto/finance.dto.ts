import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const asString = ({ value }: { value: unknown }) => (value === undefined || value === null ? value : String(value));

export class CreateBankAccountDto {
  @IsString() @MinLength(2) @MaxLength(120)
  bankName!: string;

  @IsString() @MinLength(2) @MaxLength(150)
  accountHolder!: string;

  @Transform(asString) @IsString() @Matches(/^[A-Za-z0-9-]{6,34}$/)
  accountNumber!: string;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;
}

export class RequestPayoutDto {
  @Transform(asString) @IsString() @Matches(/^[1-9]\d{0,14}$/)
  amount!: string;

  @IsOptional() @IsUUID()
  bankAccountId?: string;
}

export class PayoutStatusDto {
  @IsString() @IsIn(['PROCESSING', 'COMPLETED', 'FAILED'])
  status!: 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class CancelPayoutDto {
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class RefundOrderDto {
  /** Omit amount only to refund the remaining refundable total. */
  @IsOptional() @Transform(asString) @IsString() @Matches(/^[1-9]\d{0,14}$/)
  amount?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  reason?: string;
}
