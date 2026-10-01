import { BadRequestException, ForbiddenException, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../account/notifications.service';
import { IdempotencyService } from '../finance/idempotency.service';
import { FraudService } from '../fraud/fraud.service';

export type ChatFile = { buffer: Buffer; mimetype: string; size?: number };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const CHAT_LIMITS = { images: 5, imageBytes: 8 * 1024 * 1024, videoBytes: 25 * 1024 * 1024, newAccountMediaPerDay: 10, recallHours: 24 };
/** Kiểm tra chữ ký tệp để không tin hoàn toàn vào mimetype do client khai báo. */
export function sniffMedia(f: ChatFile): 'IMAGE' | 'VIDEO' | null {
  const b = f.buffer;
  if (!b || b.length < 12) return null;
  const isJpg = b[0] === 0xff && b[1] === 0xd8, isPng = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), isWebp = b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP';
  if (IMAGE_TYPES.includes(f.mimetype) && (isJpg || isPng || isWebp)) return 'IMAGE';
  const isMp4 = b.subarray(4, 8).toString() === 'ftyp', isWebm = b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  if (VIDEO_TYPES.includes(f.mimetype) && (isMp4 || isWebm)) return 'VIDEO';
  return null;
}

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly idempotency: IdempotencyService = new IdempotencyService(), @Optional() private readonly fraud?: FraudService, @Optional() private readonly storage?: StorageService) {}

  private mediaReady = false;
  async onModuleInit() {
    try {
      await this.db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'TEXT'`);
      await this.db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB`);
      await this.db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS recalled_at TIMESTAMPTZ`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS message_hidden(message_id UUID NOT NULL, user_id UUID NOT NULL, hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(message_id,user_id))`);
      this.mediaReady = true;
    } catch { this.mediaReady = false; }
  }

  async list(uid: string) {
    const result = await this.db.query(`SELECT c.id,c.product_id,c.last_message_at,u.id AS other_id,u.full_name AS other_name,(c.seller_id=$1) AS seller_id_is_me,
      p.title AS product_title,p.status::text AS product_status,p.price::text AS product_price,p.listing_price_mode AS product_price_mode,p.address AS product_address,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS product_image,${this.mediaReady ? "CASE WHEN m.recalled_at IS NOT NULL THEN 'Tin nhắn đã được thu hồi' ELSE m.content END" : 'm.content'} AS last_message
      FROM chats c JOIN users u ON u.id=CASE WHEN c.buyer_id=$1 THEN c.seller_id ELSE c.buyer_id END
      JOIN products p ON p.id=c.product_id ${this.mediaReady
        ? 'LEFT JOIN LATERAL (SELECT x.content,x.recalled_at FROM messages x WHERE x.chat_id=c.id AND NOT EXISTS(SELECT 1 FROM message_hidden h WHERE h.message_id=x.id AND h.user_id=$1) ORDER BY x.created_at DESC,x.id DESC LIMIT 1) m ON true'
        : 'LEFT JOIN messages m ON m.id=c.last_message_id'}
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
    const result = await this.db.query(`SELECT m.* FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.chat_id=$1 AND ($2 IN (c.buyer_id,c.seller_id))${this.mediaReady ? ' AND NOT EXISTS(SELECT 1 FROM message_hidden h WHERE h.message_id=m.id AND h.user_id=$2)' : ''} ORDER BY m.created_at`, [id, uid]);
    return { success: true, data: await Promise.all(result.rows.map(row => this.present(row, uid))), message: null, errorCode: null };
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
      const flags = this.fraud ? await this.fraud.flagsFor(text) : [];
      if (this.fraud) await this.fraud.assertChatAllowed(client, uid, flags);
      const message = flags.length
        ? await client.query(`INSERT INTO messages(chat_id,sender_id,content,safety_flags)VALUES($1,$2,$3,$4) RETURNING *`, [id, uid, text, flags])
        : await client.query(`INSERT INTO messages(chat_id,sender_id,content)VALUES($1,$2,$3) RETURNING *`, [id, uid, text]);
      await client.query('UPDATE chats SET last_message_id=$1,last_message_at=NOW(),updated_at=NOW() WHERE id=$2', [message.rows[0].id, id]);
      if (claim) await this.idempotency.complete(client, claim.scopedKey, message.rows[0]);
      return { message: message.rows[0], recipientId };
    });
    if (result.recipientId) void this.notifications.create(result.recipientId, 'CHAT_MESSAGE', 'Tin nhắn mới', text.slice(0, 160), 'CHAT', id).catch(() => undefined);
    return { success: true, data: { ...(result.message as any), can_recall: this.mediaReady }, message: null, errorCode: null };
  }

  /** Dạng trả về cho người dùng: tin đã thu hồi bị ẩn nội dung; thêm cờ được phép thu hồi. */
  private async present(row: any, uid: string) {
    if (row?.recalled_at) return { id: row.id, chat_id: row.chat_id, sender_id: row.sender_id, created_at: row.created_at, kind: 'RECALLED', recalled_at: row.recalled_at, content: '', attachments: null, safety_flags: null, can_recall: false };
    const withUrls = await this.withUrls(row);
    const can = row?.sender_id === uid && Date.now() - new Date(row.created_at).getTime() < CHAT_LIMITS.recallHours * 3_600_000;
    return { ...withUrls, can_recall: this.mediaReady && can };
  }

  /** Thu hồi (xóa với mọi người): chỉ người gửi, trong thời hạn. Nội dung gốc vẫn được giữ kín trong hệ thống để xử lý khiếu nại/gian lận. */
  async recall(uid: string, chatId: string, messageId: string) {
    if (!this.mediaReady) throw new BadRequestException('Tính năng thu hồi chưa sẵn sàng. Vui lòng thử lại sau ít phút.');
    const row = await this.db.transaction(async client => {
      const found = await client.query('SELECT m.* FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.id=$1 AND m.chat_id=$2 AND ($3 IN (c.buyer_id,c.seller_id)) FOR UPDATE OF m', [messageId, chatId, uid]);
      const m = found.rows[0];
      if (!m) throw new ForbiddenException('Không tìm thấy tin nhắn');
      if (m.sender_id !== uid) throw new ForbiddenException('Bạn chỉ có thể thu hồi tin nhắn do chính bạn gửi');
      if (m.recalled_at) return m;
      if (Date.now() - new Date(m.created_at).getTime() >= CHAT_LIMITS.recallHours * 3_600_000) throw new BadRequestException(`Chỉ thu hồi được tin nhắn trong vòng ${CHAT_LIMITS.recallHours} giờ sau khi gửi. Bạn vẫn có thể xóa tin ở phía mình.`);
      const updated = await client.query('UPDATE messages SET recalled_at=NOW() WHERE id=$1 RETURNING *', [messageId]);
      return updated.rows[0];
    });
    return { success: true, data: await this.present(row, uid), message: null, errorCode: null };
  }

  /** Xóa ở phía tôi: chỉ ẩn tin nhắn với người xóa, người kia vẫn thấy. */
  async hideForMe(uid: string, chatId: string, messageId: string) {
    if (!this.mediaReady) throw new BadRequestException('Tính năng xóa tin nhắn chưa sẵn sàng. Vui lòng thử lại sau ít phút.');
    const found = await this.db.query('SELECT m.id FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.id=$1 AND m.chat_id=$2 AND ($3 IN (c.buyer_id,c.seller_id))', [messageId, chatId, uid]);
    if (!found.rows[0]) throw new ForbiddenException('Không tìm thấy tin nhắn');
    await this.db.query('INSERT INTO message_hidden(message_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [messageId, uid]);
    return { success: true, data: { id: messageId }, message: null, errorCode: null };
  }

  /** Gắn URL xem có hạn cho tệp đính kèm (ảnh/video); vị trí giữ nguyên. */
  private async withUrls(row: any) {
    if (!row?.attachments || !Array.isArray(row.attachments) || !this.storage) return row;
    const attachments = await Promise.all(row.attachments.map(async (a: any) => a?.key ? { ...a, url: await this.storage!.chatMediaUrl(a.key) } : a));
    return { ...row, attachments };
  }

  private async insertRich(uid: string, id: string, kind: 'IMAGE' | 'VIDEO' | 'LOCATION', text: string, preview: string, attachments: unknown[]) {
    if (!this.mediaReady) throw new BadRequestException('Tính năng gửi ảnh, video và vị trí chưa sẵn sàng. Vui lòng thử lại sau ít phút.');
    const flags = text && this.fraud ? await this.fraud.flagsFor(text) : [];
    const result = await this.db.transaction(async client => {
      const chat = await client.query<{ id: string; buyer_id: string; seller_id: string }>('SELECT id,buyer_id,seller_id FROM chats WHERE id=$1 AND ($2 IN (buyer_id,seller_id)) FOR UPDATE', [id, uid]);
      if (!chat.rows[0]) throw new ForbiddenException();
      const recipientId = chat.rows[0].buyer_id === uid ? chat.rows[0].seller_id : chat.rows[0].buyer_id;
      await this.assertNotBlocked(client, uid, recipientId);
      if (this.fraud && text) await this.fraud.assertChatAllowed(client, uid, flags);
      const message = await client.query(
        `INSERT INTO messages(chat_id,sender_id,content,kind,attachments${flags.length ? ',safety_flags' : ''}) VALUES($1,$2,$3,$4,$5::jsonb${flags.length ? ',$6' : ''}) RETURNING *`,
        flags.length ? [id, uid, text || preview, kind, JSON.stringify(attachments), flags] : [id, uid, text || preview, kind, JSON.stringify(attachments)],
      );
      await client.query('UPDATE chats SET last_message_id=$1,last_message_at=NOW(),updated_at=NOW() WHERE id=$2', [message.rows[0].id, id]);
      return { message: message.rows[0], recipientId };
    });
    void this.notifications.create(result.recipientId, 'CHAT_MESSAGE', 'Tin nhắn mới', (text || preview).slice(0, 160), 'CHAT', id).catch(() => undefined);
    return { success: true, data: { ...(await this.withUrls(result.message)), can_recall: true }, message: null, errorCode: null };
  }

  private async assertMediaQuota(uid: string, count: number) {
    if (!this.fraud) return;
    if (!(await this.fraud.isNewAccount(this.db, uid))) return;
    const used = (await this.db.query(`SELECT COALESCE(SUM(jsonb_array_length(attachments)),0)::int AS n FROM messages WHERE sender_id=$1 AND kind IN ('IMAGE','VIDEO') AND created_at > now() - interval '24 hours'`, [uid])).rows[0]?.n ?? 0;
    if (used + count > CHAT_LIMITS.newAccountMediaPerDay) throw new BadRequestException(`Tài khoản mới chỉ được gửi tối đa ${CHAT_LIMITS.newAccountMediaPerDay} ảnh/video mỗi 24 giờ. Hãy xác minh tài khoản để bỏ giới hạn này.`);
  }

  async sendMedia(uid: string, id: string, files: ChatFile[], caption?: string) {
    if (!this.storage) throw new BadRequestException('Chưa cấu hình kho lưu trữ tệp');
    const list = Array.isArray(files) ? files : [];
    if (!list.length) throw new BadRequestException('Vui lòng chọn ảnh hoặc video để gửi');
    const text = (caption ?? '').trim();
    if (text.length > 2000) throw new BadRequestException('Chú thích tối đa 2.000 ký tự');
    const kinds = list.map(f => sniffMedia(f));
    if (kinds.some(k => !k)) throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG/PNG/WebP và video MP4/WebM/MOV hợp lệ');
    const videos = kinds.filter(k => k === 'VIDEO').length;
    if (videos && list.length > 1) throw new BadRequestException('Mỗi tin nhắn chỉ gửi 1 video, không gửi kèm ảnh khác');
    if (!videos && list.length > CHAT_LIMITS.images) throw new BadRequestException(`Tối đa ${CHAT_LIMITS.images} ảnh mỗi tin nhắn`);
    for (const f of list) {
      const size = f.size ?? f.buffer.length;
      if (size > (sniffMedia(f) === 'VIDEO' ? CHAT_LIMITS.videoBytes : CHAT_LIMITS.imageBytes)) throw new BadRequestException(sniffMedia(f) === 'VIDEO' ? 'Video tối đa 25 MB' : 'Mỗi ảnh tối đa 8 MB');
    }
    const member = await this.db.query('SELECT 1 FROM chats WHERE id=$1 AND ($2 IN (buyer_id,seller_id))', [id, uid]);
    if (!member.rows[0]) throw new ForbiddenException('Bạn không có quyền gửi vào hội thoại này');
    await this.assertMediaQuota(uid, list.length);
    const kind = videos ? 'VIDEO' : 'IMAGE';
    const attachments: unknown[] = [];
    for (const f of list) attachments.push({ type: kind === 'VIDEO' ? 'video' : 'image', key: await this.storage.uploadChatMedia(uid, f, kind), mime: f.mimetype });
    return this.insertRich(uid, id, kind, text, kind === 'VIDEO' ? '[Video]' : list.length > 1 ? `[${list.length} hình ảnh]` : '[Hình ảnh]', attachments);
  }

  async sendLocation(uid: string, id: string, loc: { lat: number; lng: number; label?: string }) {
    const lat = Number(loc?.lat), lng = Number(loc?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new BadRequestException('Vị trí không hợp lệ');
    const label = (loc.label ?? '').toString().trim().slice(0, 200);
    const member = await this.db.query('SELECT 1 FROM chats WHERE id=$1 AND ($2 IN (buyer_id,seller_id))', [id, uid]);
    if (!member.rows[0]) throw new ForbiddenException('Bạn không có quyền gửi vào hội thoại này');
    return this.insertRich(uid, id, 'LOCATION', '', '[Vị trí]', [{ type: 'location', lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, label }]);
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
