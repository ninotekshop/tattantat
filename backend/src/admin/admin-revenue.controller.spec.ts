jest.mock('exceljs', () => ({ __esModule: true, default: { Workbook: jest.fn() } }));
jest.mock('pdfkit', () => ({ __esModule: true, default: jest.fn() }));

import { AdminRevenueController } from './admin-revenue.controller';

describe('AdminRevenueController transactions', () => {
  const db = { query: jest.fn(), transaction: jest.fn() };
  const controller = new AdminRevenueController(db as never, { refresh: jest.fn() } as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects an unknown ledger type without querying the database', async () => {
    await expect(controller.transactions(undefined, undefined, 'UNSAFE_TYPE', undefined, undefined, undefined))
      .rejects.toThrow('Loại giao dịch không hợp lệ');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('rejects a malformed order id without querying the database', async () => {
    await expect(controller.transactions(undefined, undefined, undefined, 'not-a-uuid', undefined, undefined))
      .rejects.toThrow('orderId không hợp lệ');
    expect(db.query).not.toHaveBeenCalled();
  });
});
