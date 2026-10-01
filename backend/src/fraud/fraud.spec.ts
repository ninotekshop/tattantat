import { BadRequestException } from '@nestjs/common';
import { FraudService } from './fraud.service';

const svc = () => new FraudService();
const db = (rows: any[][]) => { const q = [...rows]; return { query: jest.fn(async () => ({ rows: q.shift() ?? [] })) }; };

describe('FraudService', () => {
  it('flags advance payment, off-platform contact, links, phone and OTP requests', () => {
    const s = svc();
    expect(s.scanChat('Bạn chuyển khoản trước giúp mình nhé')).toContain('ADVANCE_PAYMENT');
    expect(s.scanChat('Kết bạn zalo nói chuyện')).toContain('OFF_PLATFORM');
    expect(s.scanChat('xem tại http://abc.xyz/x')).toContain('LINK');
    expect(s.scanChat('gọi 0912 345 678')).toContain('PHONE');
    expect(s.scanChat('cho mình mã OTP')).toContain('OTP_REQUEST');
    expect(s.scanChat('Sản phẩm còn không bạn?')).toEqual([]);
  });
  it('recognises a bank account number instead of mistaking it for a phone', () => {
    const f = svc().scanChat('0051000499958 - Lê Trung Hiếu - Vietcombank Bình Định');
    expect(f).toContain('BANK_ACCOUNT');
    expect(f).not.toContain('PHONE');
    expect(svc().scanChat('gọi 0912345678 nhé')).toContain('PHONE');
  });

  it('blocks contact info from new unverified accounts only', async () => {
    const s = svc();
    (s as any).cache = { at: Date.now(), value: { chatWarnings: true, newAccountDays: 7, newAccountBlockContactInChat: true, newAccountDailyListings: 5, duplicateCheck: true } };
    const fresh = db([[{ verified: false, created_at: new Date().toISOString() }]]);
    await expect(s.assertChatAllowed(fresh, 'u', ['PHONE'])).rejects.toBeInstanceOf(BadRequestException);
    const old = db([[{ verified: false, created_at: new Date(Date.now() - 30 * 86400000).toISOString() }]]);
    await expect(s.assertChatAllowed(old, 'u', ['PHONE'])).resolves.toBeUndefined();
    await expect(s.assertChatAllowed(fresh, 'u', ['ADVANCE_PAYMENT'])).resolves.toBeUndefined();
  });
  it('limits daily listings of new accounts', async () => {
    const s = svc();
    (s as any).cache = { at: Date.now(), value: { chatWarnings: true, newAccountDays: 7, newAccountBlockContactInChat: true, newAccountDailyListings: 2, duplicateCheck: true } };
    const d = db([[{ verified: false, created_at: new Date().toISOString() }], [{ n: 5 }]]);
    await expect(s.assertCanPost(d, 'u')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('reports duplicate titles', async () => {
    const s = svc();
    (s as any).cache = { at: Date.now(), value: { chatWarnings: true, newAccountDays: 7, newAccountBlockContactInChat: true, newAccountDailyListings: 5, duplicateCheck: true } };
    expect(await s.duplicateReasons(db([[{ mine: false }]]), 'u', 'iPhone 13 Pro Max 256GB')).toEqual(['Tiêu đề trùng với tin của người bán khác']);
    expect(await s.duplicateReasons(db([]), 'u', 'ngắn')).toEqual([]);
  });
});
