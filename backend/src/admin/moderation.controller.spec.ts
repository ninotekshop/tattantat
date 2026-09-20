import { ModerationController } from './moderation.controller';

describe('ModerationController', () => {
  it('rejects an unknown report status before querying', async () => {
    const db = { query: jest.fn() };
    const controller = new ModerationController(db as never);

    await expect(controller.list('DROP_TABLE', undefined)).rejects.toThrow('Trạng thái báo cáo không hợp lệ');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('writes an immutable moderation audit event with the status update', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'report-1', status: 'OPEN' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'report-1', status: 'RESOLVED', reviewed_by: 'admin-1' }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const db = { transaction: jest.fn(async (work: (value: typeof client) => Promise<unknown>) => work(client)) };
    const controller = new ModerationController(db as never);

    const result = await controller.update({ user: { id: 'admin-1' } }, 'report-1', { status: 'RESOLVED', note: 'Đã xử lý' });

    expect(result.data).toMatchObject({ id: 'report-1', status: 'RESOLVED' });
    expect(client.query.mock.calls[2][0]).toContain('moderation_audit_logs');
    expect(client.query.mock.calls[2][1]).toEqual(['report-1', 'admin-1', 'OPEN', 'RESOLVED', 'Đã xử lý']);
  });

  it('hides a reported product and resolves the report in one transaction', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'report-1', status: 'REVIEWING', product_id: 'product-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'product-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'report-1', status: 'RESOLVED' }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const db = { transaction: jest.fn(async (work: (value: typeof client) => Promise<unknown>) => work(client)) };
    const controller = new ModerationController(db as never);

    const result = await controller.hideReportedProduct({ user: { id: 'admin-1' } }, 'report-1', 'Vi phạm chính sách');

    expect(result.data).toMatchObject({ id: 'report-1', status: 'RESOLVED' });
    expect(client.query.mock.calls[1][0]).toContain("status='HIDDEN'");
    expect(client.query.mock.calls[3][1]).toEqual(['report-1', 'admin-1', 'REVIEWING', 'HIDE_PRODUCT: Vi phạm chính sách']);
  });
});
