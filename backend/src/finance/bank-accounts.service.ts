import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { CreateBankAccountDto } from './dto/finance.dto';

interface BankAccountRow {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number_last4: string;
  is_default: boolean;
  status: string;
  created_at: Date;
}

@Injectable()
export class BankAccountsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async list(sellerId: string) {
    const result = await this.db.query<BankAccountRow>(
      `SELECT id, bank_name, account_holder, account_number_last4, is_default, status, created_at
       FROM seller_bank_accounts WHERE seller_id=$1 AND status='ACTIVE'
       ORDER BY is_default DESC, created_at DESC`,
      [sellerId],
    );
    return result.rows.map((row) => this.publicRow(row));
  }

  async create(sellerId: string, dto: CreateBankAccountDto) {
    const normalizedNumber = dto.accountNumber.replace(/-/g, '').toUpperCase();
    const encrypted = this.encrypt(normalizedNumber);
    const last4 = normalizedNumber.slice(-4).padStart(4, '*');

    return this.db.transaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM seller_bank_accounts
         WHERE seller_id=$1 AND status='ACTIVE' FOR UPDATE`,
        [sellerId],
      );
      const shouldBeDefault = dto.isDefault === true || existing.rows.length === 0;
      if (shouldBeDefault) {
        await client.query(
          `UPDATE seller_bank_accounts SET is_default=FALSE, updated_at=NOW()
           WHERE seller_id=$1 AND is_default=TRUE`,
          [sellerId],
        );
      }

      const result = await client.query<BankAccountRow>(
        `INSERT INTO seller_bank_accounts(
           seller_id, bank_name, account_holder, account_number_encrypted,
           account_number_last4, is_default
         ) VALUES($1,$2,$3,$4,$5,$6)
         RETURNING id, bank_name, account_holder, account_number_last4, is_default, status, created_at`,
        [sellerId, dto.bankName.trim(), dto.accountHolder.trim(), encrypted, last4, shouldBeDefault],
      );
      const account = this.publicRow(result.rows[0]);
      await client.query(
        `INSERT INTO financial_audit_logs(actor_id, action, entity_type, entity_id, new_value)
         VALUES($1,'SELLER_BANK_ACCOUNT_CREATED','SELLER_BANK_ACCOUNT',$2,$3::jsonb)`,
        [sellerId, account.id, JSON.stringify(account)],
      );
      return account;
    });
  }

  private publicRow(row: BankAccountRow) {
    return {
      id: row.id,
      bankName: row.bank_name,
      accountHolder: row.account_holder,
      accountNumberMasked: `****${row.account_number_last4}`,
      isDefault: row.is_default,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private encrypt(value: string): Buffer {
    const secret = this.config.get<string>('BANK_ACCOUNT_ENCRYPTION_KEY');
    if (!secret) {
      throw new ServiceUnavailableException('Chưa cấu hình mã hóa tài khoản ngân hàng');
    }
    const key = Buffer.from(secret, 'base64');
    if (key.length !== 32) {
      throw new BadRequestException('BANK_ACCOUNT_ENCRYPTION_KEY phải là khóa base64 32 byte');
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Versioned payload: [version=1][12 byte IV][16 byte tag][ciphertext].
    return Buffer.concat([Buffer.from([1]), iv, tag, ciphertext]);
  }
}
