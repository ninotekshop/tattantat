import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { FinanceAuthorizationService } from './finance-authorization.service';

const CACHE_MS = 60_000;

/** Applied after JwtAuthGuard. Admin reporting and payout settlement must never
 * be available merely because a caller owns a valid customer token.
 * Kiểm tra bằng đúng 1 truy vấn (không mở giao dịch) và nhớ kết quả "là admin" trong 60 giây
 * để không tốn thêm các lượt gọi tới DB ở xa cho mỗi yêu cầu. */
@Injectable()
export class FinanceAdminGuard implements CanActivate {
  private readonly allowed = new Map<string, number>();
  constructor(private readonly db: DatabaseService, private readonly authorization: FinanceAuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    const actorId = request.user?.id;
    if (!actorId) return false;
    const until = this.allowed.get(actorId);
    if (until && until > Date.now()) return true;
    const runner = { query: (text: string, values?: unknown[]) => this.db.query(text, values) } as unknown as PoolClient;
    if (!(await this.authorization.isFinanceAdmin(runner, actorId))) {
      this.allowed.delete(actorId);
      throw new ForbiddenException('Chỉ quản trị viên tài chính được thực hiện thao tác này');
    }
    if (this.allowed.size > 500) this.allowed.clear();
    this.allowed.set(actorId, Date.now() + CACHE_MS);
    return true;
  }
}
