import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';

const make = (msg: any | undefined) => {
  const q = jest.fn(async (sql: string) => sql.startsWith('SELECT m.*') ? { rows: msg ? [msg] : [] } : sql.startsWith('UPDATE messages') ? { rows: [{ ...msg, recalled_at: new Date() }] } : { rows: [{ id: 'm' }] });
  const db: any = { query: q, transaction: async (fn: any) => fn({ query: q }) };
  const s = new ChatService(db, { create: jest.fn() } as any);
  (s as any).mediaReady = true;
  return { s, q };
};
const fresh = (over = {}) => ({ id: 'm1', chat_id: 'c1', sender_id: 'me', content: 'hi', created_at: new Date(), recalled_at: null, ...over });

describe('message recall / delete for me', () => {
  it('lets the sender recall a recent message and hides its content', async () => {
    const r: any = await make(fresh()).s.recall('me', 'c1', 'm1');
    expect(r.data.kind).toBe('RECALLED');
    expect(r.data.content).toBe('');
    expect(r.data.attachments).toBeNull();
  });
  it('refuses recall by the other party', async () => {
    await expect(make(fresh()).s.recall('other', 'c1', 'm1')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('refuses recall after the time window', async () => {
    await expect(make(fresh({ created_at: new Date(Date.now() - 25 * 3_600_000) })).s.recall('me', 'c1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('refuses unknown messages and hides only for the requesting user', async () => {
    await expect(make(undefined).s.recall('me', 'c1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
    const { s, q } = make(undefined);
    (q as any).mockImplementation(async (sql: string) => sql.startsWith('SELECT m.id') ? { rows: [{ id: 'm1' }] } : { rows: [] });
    await s.hideForMe('me', 'c1', 'm1');
    expect(q).toHaveBeenCalledWith(expect.stringContaining('message_hidden'), ['m1', 'me']);
  });
});
