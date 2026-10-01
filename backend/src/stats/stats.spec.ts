import { BadRequestException } from '@nestjs/common';
import { SellerStatsService } from './seller-stats.service';

describe('SellerStatsService', () => {
  it('validates range and shapes the overview', async () => {
    const rows = [[{ active_listings: 2, total_views: '50', new_chats: 3, new_favorites: 1 }], [{ orders: 4, completed: 3, cancelled: 1, revenue: '900000', in_progress: '0' }], [{ day: '2026-09-29', orders: 1, revenue: '0' }], [{ id: 'p', title: 'A', views: '50', status: 'ACTIVE', chats: 3, orders: 1 }]];
    const svc = new SellerStatsService({ query: jest.fn(async () => ({ rows: rows.shift() })) } as any);
    await expect(svc.overview('s', '0')).rejects.toBeInstanceOf(BadRequestException);
    const r: any = await svc.overview('s', '30');
    expect(r.data.orders.completionRate).toBe(75); expect(r.data.totals.activeListings).toBe(2); expect(r.data.topListings).toHaveLength(1);
  });
});
