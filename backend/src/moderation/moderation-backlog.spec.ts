import { ModerationBacklogService } from './moderation-backlog.service';

function make(opts: { enabled?: boolean; overdue?: number; lock?: boolean; last?: string } = {}) {
  const settings = { backlogReminder: opts.enabled ?? true, backlogHours: 4, backlogRepeatHours: 6 };
  const policy: any = { settings: jest.fn().mockResolvedValue(settings), backlog: jest.fn().mockResolvedValue({ pending: 5, overdue: opts.overdue ?? 2, oldest: new Date(Date.now() - 8 * 3_600_000).toISOString() }) };
  const client = { query: jest.fn(async (sql: string) => {
    if (sql.includes('pg_try_advisory')) return { rows: [{ ok: opts.lock ?? true }] };
    if (sql.includes('SELECT value')) return { rows: opts.last ? [{ at: opts.last }] : [] };
    return { rows: [] };
  }) };
  const db: any = { transaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn().mockResolvedValue({ rows: [{ id: 'a1' }, { id: 'a2' }] }) };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  return { svc: new ModerationBacklogService(db, policy, notifications), notifications, db };
}

describe('ModerationBacklogService', () => {
  it('nhắc mọi quản trị viên khi có tin quá hạn', async () => {
    const { svc, notifications } = make();
    expect(await svc.run()).toBe(2);
    expect(notifications.create).toHaveBeenCalledTimes(2);
    expect(notifications.create.mock.calls[0][1]).toBe('ADMIN_MODERATION_BACKLOG');
  });
  it('không nhắc khi tắt tính năng, trừ khi bấm gửi ngay', async () => {
    const off = make({ enabled: false });
    expect(await off.svc.run()).toBe(0);
    expect(await off.svc.run(true)).toBe(2);
  });
  it('không nhắc khi không có tin quá hạn', async () => {
    const { svc, notifications } = make({ overdue: 0 });
    expect(await svc.run()).toBe(0);
    expect(notifications.create).not.toHaveBeenCalled();
  });
  it('không nhắc lặp trong khoảng nhắc lại và khi không giành được khóa', async () => {
    expect(await make({ last: new Date().toISOString() }).svc.run()).toBe(0);
    expect(await make({ lock: false }).svc.run()).toBe(0);
  });
});
