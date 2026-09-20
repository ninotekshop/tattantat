import { CommercialQueueController } from './commercial-queue.controller';

describe('CommercialQueueController', () => {
  it('rejects invalid statuses before querying commercial data', async () => {
    const db = { query: jest.fn() };
    const controller = new CommercialQueueController(db as never);

    await expect(controller.queue('DROP TABLE', undefined)).rejects.toThrow('status không hợp lệ');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('defaults to the bounded open queue', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new CommercialQueueController(db as never);

    await expect(controller.queue(undefined, undefined)).resolves.toMatchObject({ meta: { status: 'OPEN', limit: 100 }, data: [] });
    expect(db.query.mock.calls[0][1]).toEqual(['OPEN', 100]);
  });
});
