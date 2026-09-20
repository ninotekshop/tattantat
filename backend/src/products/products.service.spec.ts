import { ProductsService } from './products.service';

describe('ProductsService safety isolation', () => {
  it('passes the authenticated viewer to the blocked-seller filter for product lists', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new ProductsService(db as never);

    await expect(service.list('laptop', undefined, 'viewer-1')).resolves.toMatchObject({ data: [] });

    expect(db.query.mock.calls[0][0]).toContain('user_blocks');
    expect(db.query.mock.calls[0][1]).toEqual(['laptop', null, 'viewer-1']);
  });

  it('keeps anonymous browsing supported without applying a viewer filter', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new ProductsService(db as never);

    await expect(service.detail('product-1')).rejects.toThrow('Không tìm thấy sản phẩm');

    expect(db.query.mock.calls[0][1]).toEqual(['product-1', null]);
  });
});
