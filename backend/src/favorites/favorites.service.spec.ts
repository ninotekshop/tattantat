import { Test } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { FavoritesService } from './favorites.service';

describe('Favorites runtime injection', () => {
  it('resolves its database dependency through Nest and preserves price modes', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'product', price: '0.00', listing_price_mode: 'CONTACT', seller_id: 'seller', status: 'ACTIVE' }] }) };
    const module = await Test.createTestingModule({ providers: [FavoritesService, { provide: DatabaseService, useValue: db }] }).compile();
    const result = await module.get(FavoritesService).list('buyer');
    expect(result.data[0]).toMatchObject({ priceMode: 'CONTACT', sellerId: 'seller' });
    expect(db.query.mock.calls[0][0]).toContain('user_blocks');
    await module.close();
  });
});
