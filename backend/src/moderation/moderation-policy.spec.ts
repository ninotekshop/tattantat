import { ModerationService } from '../admin/moderation.service';
import { ModerationPolicyService, type ModerationSettings } from './moderation-policy.service';

function make(settings: Partial<ModerationSettings>, seller = { verified: false, approved: 0 }, chain: string[] = ['5']) {
  const db = { query: jest.fn(async (sql: string) => {
    if (sql.includes("key='moderation'")) return { rows: [{ value: settings }] };
    if (sql.includes('is_verified')) return { rows: [seller] };
    if (sql.includes('RECURSIVE')) return { rows: chain.map(id => ({ id })) };
    return { rows: [] };
  }) };
  return new ModerationPolicyService(db as never, new ModerationService());
}
const post = (extra: Record<string, unknown> = {}) => ({ sellerId: 's1', categoryId: '5', title: 'Bán máy ảnh Canon 90D', description: 'Máy đẹp, ít dùng', price: 15_000_000, ...extra });

describe('ModerationPolicyService.decide', () => {
  it('AUTO: tin sạch được duyệt ngay', async () => { expect((await make({ mode: 'AUTO' }).decide(post())).action).toBe('APPROVE'); });
  it('MANUAL: mọi tin vào hàng chờ, kể cả người bán uy tín', async () => {
    const d = await make({ mode: 'MANUAL' }, { verified: true, approved: 50 }).decide(post());
    expect(d.action).toBe('PENDING_REVIEW');
  });
  it('MANUAL: sửa tin không cần duyệt lại khi tắt reviewEdits', async () => {
    expect((await make({ mode: 'MANUAL', reviewEdits: false }).decide(post({ isEdit: true }))).action).toBe('APPROVE');
    expect((await make({ mode: 'MANUAL', reviewEdits: true }).decide(post({ isEdit: true }))).action).toBe('PENDING_REVIEW');
  });
  it('HYBRID: người bán mới vào hàng chờ, người bán uy tín được duyệt tự động', async () => {
    expect((await make({ mode: 'HYBRID' }, { verified: false, approved: 0 }).decide(post())).action).toBe('PENDING_REVIEW');
    expect((await make({ mode: 'HYBRID', trustedMinApproved: 3 }, { verified: false, approved: 3 }).decide(post())).action).toBe('APPROVE');
    expect((await make({ mode: 'HYBRID' }, { verified: true, approved: 0 }).decide(post())).action).toBe('APPROVE');
  });
  it('HYBRID: từ khóa, ngưỡng giá và danh mục bắt buộc duyệt dù người bán uy tín', async () => {
    const trusted = { verified: true, approved: 99 };
    expect((await make({ mode: 'HYBRID', reviewKeywords: ['iphone'] }, trusted).decide(post({ title: 'Bán iPhone 15' }))).action).toBe('PENDING_REVIEW');
    expect((await make({ mode: 'HYBRID', priceReviewThreshold: 10_000_000 }, trusted).decide(post())).action).toBe('PENDING_REVIEW');
    expect((await make({ mode: 'HYBRID', priceReviewThreshold: 50_000_000 }, trusted).decide(post())).action).toBe('APPROVE');
    expect((await make({ mode: 'HYBRID', manualCategoryIds: ['5'] }, trusted).decide(post())).action).toBe('PENDING_REVIEW');
    expect((await make({ mode: 'HYBRID', manualCategoryIds: ['9'] }, trusted).decide(post())).action).toBe('APPROVE');
  });
  it('luôn chặn nội dung cấm và thông tin liên hệ khi đang bật chặn', async () => {
    expect((await make({ mode: 'AUTO' }).decide(post({ description: 'Liên hệ zalo 0901234567' }))).action).toBe('NEEDS_CHANGES');
    expect((await make({ mode: 'AUTO' }).decide(post({ title: 'Bán hàng giả' }))).action).toBe('REJECT');
    expect((await make({ mode: 'AUTO', prohibitedKeywords: ['thuốc lá lậu'] }).decide(post({ title: 'Thuốc lá lậu giá rẻ' }))).action).toBe('REJECT');
  });
  it('tắt chặn liên hệ thì chuyển tin vào hàng chờ thay vì từ chối', async () => {
    const d = await make({ mode: 'AUTO', blockContactInfo: false }).decide(post({ description: 'Liên hệ zalo 0901234567' }));
    expect(d.action).toBe('PENDING_REVIEW');
  });
  it('sanitize kiểm tra dữ liệu đầu vào', () => {
    const svc = make({});
    expect(() => svc.sanitize({ mode: 'X' as never })).toThrow();
    expect(() => svc.sanitize({ manualCategoryIds: ['abc'] })).toThrow();
    expect(svc.sanitize({ reviewKeywords: ' A \n a\nb' as never }).reviewKeywords).toEqual(['a', 'b']);
  });
});
