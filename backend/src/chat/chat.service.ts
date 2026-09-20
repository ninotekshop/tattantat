import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../account/notifications.service';
import { IdempotencyService } from '../finance/idempotency.service';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly idempotency: IdempotencyService = new IdempotencyService()) {}

  async list(uid: string) {
    const result = await this.db.query(`SELECT c.id,c.product_id,c.last_message_at,u.id AS other_id,u.full_name AS other_name,
      p.title AS product_title,p.status::text AS product_status,m.content AS last_message
      FROM chats c JOIN users u ON u.id=CASE WHEN c.buyer_id=$1 THEN c.seller_id ELSE c.buyer_id END
      JOIN products p ON p.id=c.product_id LEFT JOIN messages m ON m.id=c.last_message_id
      WHERE c.buyer_id=$1 OR c.seller_id=$1 ORDER BY COALESCE(c.last_message_at,c.created_at) DESC,c.id`, [uid]);
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  async open(buyerId: string, productId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId ?? '')) throw new BadRequestException('Sản phẩm không hợp lệ');
    return this.db.transaction(async (client) => {
      const product = await client.query<{ seller_id: string; seller_name: string }>(
        `SELECT p.seller_id,u.full_name AS seller_name FROM products p JOIN users u ON u.id=p.seller_id
         WHERE p.id=$1 AND p.deleted_at IS NULL AND (p.status='ACTIVE'
           OR EXISTS(SELECT 1 FROM chats c WHERE c.product_id=p.id AND c.buyer_id=$2 AND c.seller_id=p.seller_id)
           OR EXISTS(SELECT 1 FROM orders o WHERE o.product_id=p.id AND o.buyer_id=$2 AND o.seller_id=p.seller_id AND o.order_status NOT IN ('CANCELLED')))` , [productId, buyerId],
      );
      const item = product.rows[0];
      if (!item || item.seller_id === buyerId) throw new BadRequestException('Không thể tạo cuộc trò chuyện cho sản phẩm này');
      await this.assertNotBlocked(client, buyerId, item.seller_id);
      const chat = await client.query<{ id: string }>(
        `INSERT INTO chats(buyer_id,seller_id,product_id) VALUES($1,$2,$3)
         ON CONFLICT(buyer_id,seller_id,product_id) DO UPDATE SET updated_at=NOW() RETURNING id`, [buyerId, item.seller_id, productId],
      );
      return { success: true, data: { id: chat.rows[0].id, productId, otherName: item.seller_name }, message: null, errorCode: null };
    });
  }

  async messages(uid: string, id: string) {
    const membership = await this.db.query('SELECT id FROM chats WHERE id=$1 AND ($2 IN (buyer_id,seller_id))', [id, uid]);
    if (!membership.rows[0]) throw new ForbiddenException('Bạn không có quyền xem hội thoại này');
    const result = await this.db.query(`SELECT m.* FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.chat_id=$1 AND ($2 IN (c.buyer_id,c.seller_id)) ORDER BY m.created_at`, [id, uid]);
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  async send(uid: string, id: string, content: string, key?: string) {
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text || text.length > 2_000) throw new BadRequestException('Tin nhắn phải có từ 1 đến 2.000 ký tự');
    const result = await this.db.transaction(async client => {
      const claim = key === undefined ? null : await this.idempotency.claim<Record<string, unknown>>(client, 'chat-send', uid, key, { chatId: id, content: text });
      if (claim?.replay) return { message: claim.replay, recipientId: null };
      const chat = await client.query<{ id: string; buyer_id: string; seller_id: string }>('SELECT id,buyer_id,seller_id FROM chats WHERE id=$1 AND ($2 IN (buyer_id,seller_id)) FOR UPDATE', [id, uid]);
      if (!chat.rows[0]) throw new ForbiddenException();
      const recipientId = chat.rows[0].buyer_id === uid ? chat.rows[0].seller_id : chat.rows[0].buyer_id;
      await this.assertNotBlocked(client, uid, recipientId);
      const message = await client.query(`INSERT INTO messages(chat_id,sender_id,content)VALUES($1,$2,$3) RETURNING *`, [id, uid, text]);
      await client.query('UPDATE chats SET last_message_id=$1,last_message_at=NOW(),updated_at=NOW() WHERE id=$2', [message.rows[0].id, id]);
      if (claim) await this.idempotency.complete(client, claim.scopedKey, message.rows[0]);
      return { message: message.rows[0], recipientId };
    });
    if (result.recipientId) void this.notifications.create(result.recipientId, 'CHAT_MESSAGE', 'Tin nhắn mới', text.slice(0, 160), 'CHAT', id).catch(() => undefined);
    return { success: true, data: result.message, message: null, errorCode: null };
  }

  private async assertNotBlocked(queryable: Pick<DatabaseService, 'query'>, firstUserId: string, secondUserId: string) {
    const blocked = await queryable.query(
      `SELECT 1 FROM user_blocks
       WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)
       LIMIT 1`,
      [firstUserId, secondUserId],
    );
    if (blocked.rows[0]) throw new ForbiddenException('Không thể liên hệ do một trong hai bên đã chặn người kia');
  }
}
