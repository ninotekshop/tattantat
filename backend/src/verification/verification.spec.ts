import { BadRequestException } from '@nestjs/common';
import { normalizePhone, VerificationService } from './verification.service';

const mk = (rows: any[][]) => {
  const q = [...rows];
  const db: any = { query: jest.fn(async () => { const r = q.shift() ?? []; return { rows: r, rowCount: r.length }; }), transaction: jest.fn(async (fn: any) => fn(db)) };
  const svc = new VerificationService(db, { create: jest.fn(async () => undefined) } as any, { uploadPrivate: jest.fn(async () => 'k'), ensurePrivateBucket: jest.fn(), signedUrl: jest.fn() } as any);
  return { svc, db };
};

describe('VerificationService', () => {
  it('normalizes Vietnamese phone numbers', () => {
    expect(normalizePhone('+84 912 345 678')).toBe('0912345678');
    expect(normalizePhone('0912.345.678')).toBe('0912345678');
    expect(normalizePhone('12345')).toBeNull();
  });
  it('rejects invalid phone and rate-limits OTP requests', async () => {
    const { svc } = mk([]);
    await expect(svc.sendPhoneOtp('u', 'abc')).rejects.toBeInstanceOf(BadRequestException);
    const { svc: s2 } = mk([[], [{ last_min: 1, last_hour: 1 }]]);
    await expect(s2.sendPhoneOtp('u', '0912345678')).rejects.toThrow('60 giây');
  });
  it('mock mode returns dev code outside production and confirms the right code only', async () => {
    const { svc, db } = mk([[], [{ last_min: 0, last_hour: 0 }], [], []]);
    const sent: any = await svc.sendPhoneOtp('u', '0912345678');
    const code = sent.data.devCode as string;
    expect(code).toMatch(/^\d{6}$/);
    const hash = db.query.mock.calls[3][1][2];
    const { svc: s2, db: db2 } = mk([[{ id: 'o', phone: '0912345678', code_hash: hash, attempts: 0 }], [], []]);
    await expect(s2.confirmPhone('u', code === '000000' ? '111111' : '000000')).rejects.toThrow('không đúng');
    const { svc: s3 } = mk([[{ id: 'o', phone: '0912345678', code_hash: hash, attempts: 0 }], [], []]);
    await expect(s3.confirmPhone('u', code)).resolves.toMatchObject({ data: { phoneVerified: true } });
    void db2;
  });
  it('validates identity submission', async () => {
    const { svc } = mk([]);
    const img = { buffer: Buffer.from('x'), mimetype: 'image/png' };
    await expect(svc.submitIdentity('u', { fullName: 'Nguyễn Văn A', idNumber: '123' }, { front: img, back: img, selfie: img })).rejects.toThrow('9 hoặc 12');
    await expect(svc.submitIdentity('u', { fullName: 'Nguyễn Văn A', idNumber: '012345678901' }, { front: img })).rejects.toThrow('3 ảnh');
  });
  it('phone review: validates, queues for admin, requires a reject reason', async () => {
    const { svc } = mk([]);
    await expect(svc.requestPhoneReview('u', 'abc')).rejects.toBeInstanceOf(BadRequestException);
    const { svc: s2 } = mk([[{ full_name: 'A', phone: null, pv: false }], [], [], [{ n: 0 }], [{ id: 'p1' }], []]);
    await expect(s2.requestPhoneReview('u', '0912345678')).resolves.toMatchObject({ data: { status: 'PENDING', phone: '0912345678' } });
    await expect(svc.adminPhoneReview('a', 'id', 'REJECT', '')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires a reason to reject', async () => {
    const { svc } = mk([]);
    await expect(svc.adminReview('a', 'id', 'REJECT', '')).rejects.toBeInstanceOf(BadRequestException);
  });
});
