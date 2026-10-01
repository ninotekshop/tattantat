import { BadRequestException } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';

const mk = (rows: any[][], count = { n: 0, sample: null as string | null }) => {
  const q = [...rows]; const db: any = { query: jest.fn(async () => ({ rows: q.shift() ?? [] })), transaction: async (fn: any) => fn({ query: async () => ({ rows: [{ ok: true }] }) }) };
  const notify = { create: jest.fn(async () => undefined) };
  const svc = new SavedSearchesService(db, { countSince: jest.fn(async () => count) } as any, notify as any);
  return { svc, db, notify };
};

describe('SavedSearchesService', () => {
  it('refuses empty searches and enforces per-user cap', async () => {
    await expect(mk([]).svc.create('u', 'x', {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(mk([[{ n: 20 }]]).svc.create('u', 'x', { q: 'iphone' })).rejects.toThrow('tối đa');
  });
  it('notifies only when there are new matches', async () => {
    const row = { id: 'i', user_id: 'u', name: 'iPhone', params: { q: 'iphone' }, last_checked_at: new Date().toISOString() };
    const a = mk([[row], []], { n: 3, sample: 'iPhone 13' });
    expect(await a.svc.run()).toBe(1); expect(a.notify.create).toHaveBeenCalledWith('u', 'SAVED_SEARCH', expect.stringContaining('3 tin mới'), expect.any(String), 'SAVED_SEARCH', 'i');
    const b = mk([[row], []], { n: 0, sample: null });
    expect(await b.svc.run()).toBe(0); expect(b.notify.create).not.toHaveBeenCalled();
  });
});
