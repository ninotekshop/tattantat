import { computeTrust, getTrustLevel, TrustFacts } from './trust-score';
import { TrustService } from './trust.service';

const none: TrustFacts = { phoneVerified: false, identityVerified: false, hasPortrait: false, validListings: 0, completedTransactions: 0, walletTotal: 0, packageTransactions: 0, qualifiedReferrals: 0 };
const full: TrustFacts = { phoneVerified: true, identityVerified: true, hasPortrait: true, validListings: 5, completedTransactions: 3, walletTotal: 100_000, packageTransactions: 1, qualifiedReferrals: 1 };

describe('computeTrust', () => {
  it('tài khoản mới: 0/10, 1 sao, Thành viên mới', () => {
    const r = computeTrust(none);
    expect([r.score, r.stars, r.level]).toEqual([0, 1, 'Thành viên mới']);
  });
  it('đủ tiêu chí: 10/10, 5 sao', () => {
    const r = computeTrust(full);
    expect([r.score, r.stars, r.level]).toEqual([10, 5, 'Thành viên xuất sắc']);
    expect(r.criteria.every(c => c.completed)).toBe(true);
  });
  it('ngưỡng: 4 tin = chưa đạt, 2 giao dịch = chưa đạt, ví 99.999đ = chưa đạt', () => {
    const r = computeTrust({ ...none, validListings: 4, completedTransactions: 2, walletTotal: 99_999 });
    expect(r.score).toBe(0);
    expect(computeTrust({ ...none, validListings: 5 }).score).toBe(1);
    expect(computeTrust({ ...none, completedTransactions: 3 }).score).toBe(2);
    expect(computeTrust({ ...none, walletTotal: 100_000 }).score).toBe(2);
  });
  it('bỏ một tiêu chí 1 điểm → 9; ví không đạt → 8 (4 sao)', () => {
    expect(computeTrust({ ...full, qualifiedReferrals: 0 }).score).toBe(9);
    const r = computeTrust({ ...full, walletTotal: 0 });
    expect([r.score, r.stars]).toEqual([8, 4]);
  });
  it('quy đổi sao theo mốc', () => {
    expect([0, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => getTrustLevel(s).stars)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it('không bao giờ vượt 10', () => {
    expect(computeTrust({ ...full, validListings: 999, walletTotal: 1e12 }).score).toBe(10);
  });
});

describe('TrustService', () => {
  const mk = (handler: (sql: string, p?: unknown[]) => { rows: any[] }) => {
    const db: any = { query: jest.fn(async (s: string, p?: unknown[]) => handler(s, p)) };
    const svc = new TrustService(db);
    (svc as any).ready = Promise.resolve();
    return { svc, db };
  };

  it('ghi nhật ký khi điểm đổi và lưu cache', async () => {
    const { svc, db } = mk(s => {
      if (s.includes('FROM users u WHERE')) return { rows: [{ phone_verified: true, has_portrait: true, identity_ok: 0, listings: 0, completed: 0, wallet_total: '0', packages: 0, referrals: 0 }] };
      if (s.includes('SELECT score FROM user_trust_scores')) return { rows: [{ score: 0 }] };
      return { rows: [] };
    });
    const r = await svc.recalculateTrustScore('u1', 'phone_verified');
    expect(r?.score).toBe(2);
    const sqls = db.query.mock.calls.map((c: any[]) => String(c[0]));
    expect(sqls.some((s: string) => s.includes('INSERT INTO user_trust_scores'))).toBe(true);
    const log = db.query.mock.calls.find((c: any[]) => String(c[0]).includes('user_trust_score_logs'));
    expect(log[1]).toEqual(['u1', 0, 2, 'phone_verified']);
  });

  it('không ghi nhật ký khi điểm không đổi', async () => {
    const { svc, db } = mk(s => {
      if (s.includes('FROM users u WHERE')) return { rows: [{ phone_verified: false, has_portrait: false, identity_ok: 0, listings: 0, completed: 0, wallet_total: '0', packages: 0, referrals: 0 }] };
      if (s.includes('SELECT score FROM user_trust_scores')) return { rows: [{ score: 0 }] };
      return { rows: [] };
    });
    await svc.recalculateTrustScore('u1', 'x');
    expect(db.query.mock.calls.some((c: any[]) => String(c[0]).includes('INSERT INTO user_trust_score_logs'))).toBe(false);
  });

  it('API đọc dùng cache còn tươi, không tính lại', async () => {
    const { svc, db } = mk(s => s.includes('FROM user_trust_scores WHERE user_id') ? { rows: [{ score: 8, stars: 4, level: 'Thành viên uy tín cao', breakdown: [], calculated_at: new Date() }] } : { rows: [] });
    const r = await svc.getTrustScore('u1');
    expect(r?.score).toBe(8);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('chặn tự giới thiệu, mã sai và giới thiệu vòng A↔B', async () => {
    const A = 'aaaaaaaa-0000-4000-8000-000000000001';
    const B = 'bbbbbbbb-0000-4000-8000-000000000002';
    expect((await mk(() => ({ rows: [] })).svc.applyReferral(A, 'xyz')).ok).toBe(false);
    expect((await mk(() => ({ rows: [{ id: A }] })).svc.applyReferral(A, 'AAAAAAAA')).message).toContain('tự giới thiệu');
    const loop = mk(s => s.includes('substr(replace') ? { rows: [{ id: B }] } : s.includes('referrer_user_id=$1 AND referred_user_id=$2') ? { rows: [{}] } : { rows: [] });
    expect((await loop.svc.applyReferral(A, 'BBBBBBBB')).ok).toBe(false);
  });
});
