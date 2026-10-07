/** Logic thuần của Điểm uy tín (không truy cập DB) — dễ kiểm thử và mở rộng thêm tiêu chí. */

export interface TrustFacts {
  phoneVerified: boolean;
  identityVerified: boolean;
  hasPortrait: boolean;
  validListings: number;
  completedTransactions: number;
  walletTotal: number; // VND, tổng hoạt động ví hợp lệ
  packageTransactions: number;
  qualifiedReferrals: number;
}

export interface TrustCriterionDef {
  key: string;
  label: string;
  maxPoints: number;
  /** Trả số điểm đạt được (0..maxPoints). */
  earn: (f: TrustFacts) => number;
}

export const MAX_TRUST_SCORE = 10;
export const THRESHOLDS = { listings: 5, transactions: 3, wallet: 100_000, packages: 1, referrals: 1 } as const;

export const TRUST_CRITERIA: TrustCriterionDef[] = [
  { key: 'phone_verified', label: 'Xác thực số điện thoại', maxPoints: 1, earn: f => (f.phoneVerified ? 1 : 0) },
  { key: 'identity_verified', label: 'Xác thực giấy tờ', maxPoints: 1, earn: f => (f.identityVerified ? 1 : 0) },
  { key: 'portrait', label: 'Ảnh chân dung thật', maxPoints: 1, earn: f => (f.hasPortrait ? 1 : 0) },
  { key: 'listings', label: 'Có từ 5 tin đăng hợp lệ', maxPoints: 1, earn: f => (f.validListings >= THRESHOLDS.listings ? 1 : 0) },
  { key: 'transactions', label: 'Hoàn thành từ 3 giao dịch', maxPoints: 2, earn: f => (f.completedTransactions >= THRESHOLDS.transactions ? 2 : 0) },
  { key: 'wallet', label: 'Hoạt động ví từ 100.000đ', maxPoints: 2, earn: f => (f.walletTotal >= THRESHOLDS.wallet ? 2 : 0) },
  { key: 'package', label: 'Đã mua gói dịch vụ', maxPoints: 1, earn: f => (f.packageTransactions >= THRESHOLDS.packages ? 1 : 0) },
  { key: 'referral', label: 'Giới thiệu bạn bè', maxPoints: 1, earn: f => (f.qualifiedReferrals >= THRESHOLDS.referrals ? 1 : 0) },
];

export interface TrustCriterionResult { key: string; label: string; completed: boolean; points: number; maxPoints: number }

export function getTrustLevel(score: number): { stars: number; label: string } {
  if (score >= 9) return { stars: 5, label: 'Thành viên xuất sắc' };
  if (score >= 7) return { stars: 4, label: 'Thành viên uy tín cao' };
  if (score >= 5) return { stars: 3, label: 'Thành viên uy tín' };
  if (score >= 3) return { stars: 2, label: 'Đang xây dựng uy tín' };
  return { stars: 1, label: 'Thành viên mới' };
}

export function computeTrust(facts: TrustFacts) {
  const criteria: TrustCriterionResult[] = TRUST_CRITERIA.map(c => {
    const points = c.earn(facts);
    return { key: c.key, label: c.label, completed: points >= c.maxPoints, points, maxPoints: c.maxPoints };
  });
  const score = Math.min(criteria.reduce((s, c) => s + c.points, 0), MAX_TRUST_SCORE);
  const { stars, label } = getTrustLevel(score);
  return { score, maxScore: MAX_TRUST_SCORE, stars, level: label, criteria };
}

export type TrustResult = ReturnType<typeof computeTrust>;
