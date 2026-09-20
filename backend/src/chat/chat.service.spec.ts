import { ChatService } from './chat.service';

describe('Chat ownership and atomic writes', () => {
  function fixture(rows: unknown[][]) {
    const client = { query: jest.fn() };
    rows.forEach(row => client.query.mockResolvedValueOnce({ rows: row }));
    const db = { query: client.query, transaction: jest.fn(async work => work(client)) };
    const notifications = { create: jest.fn().mockResolvedValue(null) };
    return { client, db, notifications, service: new ChatService(db as never, notifications as never) };
  }
  it('rejects a reader outside the conversation', async () => {
    const f = fixture([[]]); await expect(f.service.messages('other', 'chat')).rejects.toThrow('quyền'); expect(f.client.query).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed messages before touching the database', async () => {
    const f = fixture([]);
    for (const text of ['', '  ', 'x'.repeat(2001), 12 as never]) await expect(f.service.send('buyer', 'chat', text)).rejects.toThrow();
    expect(f.db.transaction).not.toHaveBeenCalled();
  });
  it('blocks sending across a user block', async () => {
    const f = fixture([[{ buyer_id: 'buyer', seller_id: 'seller' }], [{ blocked: true }]]);
    await expect(f.service.send('buyer', 'chat', 'hello')).rejects.toThrow('chặn'); expect(f.notifications.create).not.toHaveBeenCalled();
  });
  it('writes message and chat pointer in the same transaction; push failure cannot fail a committed send', async () => {
    const f = fixture([[{ buyer_id: 'buyer', seller_id: 'seller' }], [], [{ id: 'message' }], []]);
    f.notifications.create.mockRejectedValue(new Error('provider offline'));
    await expect(f.service.send('buyer', 'chat', 'hello')).resolves.toMatchObject({ success: true, data: { id: 'message' } });
    expect(f.db.transaction).toHaveBeenCalledTimes(1); expect(f.client.query.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(f.notifications.create).toHaveBeenCalledWith('seller', 'CHAT_MESSAGE', 'Tin nhắn mới', 'hello', 'CHAT', 'chat');
  });
  it('does not send notification when transaction fails', async () => {
    const f = fixture([[{ buyer_id: 'buyer', seller_id: 'seller' }], [], [{ id: 'message' }]]);
    f.client.query.mockRejectedValueOnce(new Error('write failed'));
    await expect(f.service.send('buyer', 'chat', 'hello')).rejects.toThrow('write failed'); expect(f.notifications.create).not.toHaveBeenCalled();
  });
  it('replays an acknowledged send without another message or push', async () => {
    const f = fixture([]);
    const idempotency = { claim: jest.fn().mockResolvedValue({ replay: { id: 'sent-message', content: 'hello' } }), complete: jest.fn() };
    const service = new ChatService(f.db as never, f.notifications as never, idempotency as never);
    expect((await service.send('buyer', 'chat', 'hello', 'key')).data.id).toBe('sent-message');
    expect(f.client.query).not.toHaveBeenCalled(); expect(f.notifications.create).not.toHaveBeenCalled();
    expect(idempotency.claim).toHaveBeenCalledWith(f.client, 'chat-send', 'buyer', 'key', { chatId: 'chat', content: 'hello' });
  });
  it('stores the replay response in the same transaction as the new message', async () => {
    const f = fixture([[{ buyer_id: 'buyer', seller_id: 'seller' }], [], [{ id: 'message' }], []]);
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'scoped-key' }), complete: jest.fn().mockResolvedValue(null) };
    const service = new ChatService(f.db as never, f.notifications as never, idempotency as never);
    await service.send('buyer', 'chat', ' hello ', 'key');
    expect(idempotency.complete).toHaveBeenCalledWith(f.client, 'scoped-key', { id: 'message' });
  });
});
