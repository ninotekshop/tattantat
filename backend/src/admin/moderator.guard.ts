import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const CACHE_MS = 30_000;

/** Áp dụng sau JwtAuthGuard: cho phép Quản trị viên (ADMIN/SUPER_ADMIN/admin_users) và Điều hành viên (MOD).
 * MOD chỉ dùng cho các thao tác duyệt tài khoản và tin đăng; việc nhạy cảm vẫn dùng FinanceAdminGuard.
 * Quyền đọc từ CSDL (không tin vai trò trong token) và nhớ kết quả 30 giây; gọi clearModeratorCache khi đổi vai trò. */
const allowed = new Map<string, number>();
export function clearModeratorCache(userId?: string) { if (userId) allowed.delete(userId); else allowed.clear(); }

@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    const actorId = request.user?.id;
    if (!actorId) return false;
    const until = allowed.get(actorId);
    if (until && until > Date.now()) return true;
    const result = await this.db.query<{ ok: boolean }>(
      `SELECT (
         EXISTS(SELECT 1 FROM users u WHERE u.id=$1 AND u.deleted_at IS NULL AND u.status::text='ACTIVE' AND u.role::text IN ('ADMIN','SUPER_ADMIN','MOD'))
         OR EXISTS(SELECT 1 FROM admin_users a WHERE a.user_id=$1 AND a.status='ACTIVE')
       ) AS ok`,
      [actorId],
    );
    if (!result.rows[0]?.ok) {
      allowed.delete(actorId);
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
    if (allowed.size > 500) allowed.clear();
    allowed.set(actorId, Date.now() + CACHE_MS);
    return true;
  }
}
