import { ForbiddenException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class FinanceAuthorizationService {
  async isFinanceAdmin(client: PoolClient, userId: string): Promise<boolean> {
    const result = await client.query<{ is_admin: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM users u
         WHERE u.id=$1 AND u.role IN ('ADMIN'::user_role, 'SUPER_ADMIN'::user_role)
       ) OR EXISTS(
         SELECT 1 FROM admin_users a WHERE a.user_id=$1 AND a.status='ACTIVE'
       ) AS is_admin`,
      [userId],
    );
    return result.rows[0]?.is_admin === true;
  }

  async requireFinanceAdmin(client: PoolClient, userId: string): Promise<void> {
    if (!(await this.isFinanceAdmin(client, userId))) {
      throw new ForbiddenException('Chỉ quản trị viên tài chính được thực hiện thao tác này');
    }
  }
}
