import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FinanceAuthorizationService } from './finance-authorization.service';

/** Applied after JwtAuthGuard. Admin reporting and payout settlement must never
 * be available merely because a caller owns a valid customer token. */
@Injectable()
export class FinanceAdminGuard implements CanActivate {
  constructor(private readonly db: DatabaseService, private readonly authorization: FinanceAuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string } }>();
    const actorId = request.user?.id;
    if (!actorId) return false;
    await this.db.transaction((client) => this.authorization.requireFinanceAdmin(client, actorId));
    return true;
  }
}
