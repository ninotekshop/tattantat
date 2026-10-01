import { BillingExpiryService } from './billing-expiry.service';

function make(rowsBySql: (sql: string) => any[], lock = true) {
  const db: any = {
    transaction: jest.fn(async (fn: any) => fn({ query: async () => ({ rows: [{ ok: lock }] }) })),
    query: jest.fn(async (sql: string) => ({ rows: rowsBySql(sql) })),
  };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  return { svc: new BillingExpiryService(db, notifications), notifications };
}

describe('BillingExpiryService', () => {
  it('gửi nhắc cho gói sắp hết hạn, đã hết hạn và gói đẩy tin', async () => {
    const ends = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const { svc, notifications } = make(sql => {
      if (sql.includes("interval '1 day'") && sql.includes('s.ends_at > NOW()+')) return [{ id: 's1', uid: 'u1', name: 'Cửa hàng', ends_at: ends }];
      if (sql.includes("'SUBSCRIPTION_EXPIRED'")) return [{ id: 's2', uid: 'u2', name: 'Cơ bản' }];
      if (sql.includes('promotion_activations')) return [{ aid: 'a1', uid: 'u3', name: 'Đẩy tin', title: 'Xe cũ', ends_at: ends }];
      return [];
    });
    const sent = await svc.run();
    expect(sent).toBeGreaterThanOrEqual(3);
    const types = notifications.create.mock.calls.map((c: any[]) => c[1]);
    expect(types).toEqual(expect.arrayContaining(['SUBSCRIPTION_EXPIRED', 'PROMOTION_EXPIRING']));
    expect(types.some((t: string) => t.startsWith('SUBSCRIPTION_EXPIRING_'))).toBe(true);
  });
  it('không làm gì khi không giành được khóa', async () => {
    const { svc, notifications } = make(() => [{ id: 'x' }], false);
    expect(await svc.run()).toBe(0);
    expect(notifications.create).not.toHaveBeenCalled();
  });
});
