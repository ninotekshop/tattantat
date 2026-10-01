import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../account/notifications.service';
import { StorageService } from '../storage/storage.service';
import { AdminAuditLogService } from '../admin/admin-audit-log.service';

const BUCKET = 'identity-docs';
const ok = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
const sha = (v: string) => createHash('sha256').update(v).digest('hex');
type Img = { buffer: Buffer; mimetype: string };

/** Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx; trả null nếu không hợp lệ. */
export function normalizePhone(input: unknown): string | null {
  const d = String(input ?? '').replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0');
  return /^0(3|5|7|8|9)\d{8}$/.test(d) ? d : null;
}

@Injectable()
export class VerificationService implements OnModuleInit {
  private readonly log = new Logger('Verification');
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly storage: StorageService, @Optional() private readonly audit?: AdminAuditLogService) {}

  async onModuleInit() {
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS phone_otps (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, phone TEXT NOT NULL, code_hash TEXT NOT NULL, attempts INT NOT NULL DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_phone_otps_user ON phone_otps(user_id, created_at DESC)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS identity_verifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, full_name TEXT NOT NULL, id_last4 TEXT NOT NULL, id_hash TEXT NOT NULL, front_key TEXT NOT NULL, back_key TEXT NOT NULL, selfie_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', reject_reason TEXT, reviewed_by UUID, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_identity_status ON identity_verifications(status, created_at)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS phone_verifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, phone TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', reject_reason TEXT, reviewed_by UUID, reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_phone_verif_status ON phone_verifications(status, created_at)`);
      await this.storage.ensurePrivateBucket(BUCKET);
    } catch (e) { this.log.error('Không khởi tạo được bảng xác minh: ' + (e instanceof Error ? e.message : String(e))); }
  }

  // ---------- SĐT ----------
  private async sendSms(phone: string, code: string) {
    const url = process.env.SMS_WEBHOOK_URL;
    const message = `Ma xac minh Tat Tan Tat cua ban la ${code}. Co hieu luc 5 phut. Khong chia se ma nay cho bat ky ai.`;
    if (!url) { this.log.warn(`[SMS giả lập] ${phone}: ${message}`); return false; }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ phone, message }) });
    if (!res.ok) throw new BadRequestException('Không gửi được tin nhắn SMS. Vui lòng thử lại sau.');
    return true;
  }
  async status(uid: string) {
    const u = (await this.db.query(`SELECT phone, COALESCE(phone_verified,false) AS phone_verified, COALESCE(is_verified,false) AS identity_verified FROM users WHERE id=$1`, [uid])).rows[0];
    if (!u) throw new NotFoundException('Không tìm thấy tài khoản');
    const last = (await this.db.query(`SELECT id, status, reject_reason, created_at FROM identity_verifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`, [uid])).rows[0] ?? null;
    const ph = (await this.db.query(`SELECT phone, status, reject_reason FROM phone_verifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`, [uid])).rows[0] ?? null;
    return ok({ phone: u.phone, phoneVerified: u.phone_verified, phoneRequest: ph ? { phone: ph.phone, status: ph.status, rejectReason: ph.reject_reason } : null, identityVerified: u.identity_verified, identity: last ? { id: last.id, status: last.status, rejectReason: last.reject_reason, createdAt: last.created_at } : null });
  }
  async sendPhoneOtp(uid: string, rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw new BadRequestException('Số điện thoại không hợp lệ. Ví dụ: 0912345678.');
    const taken = (await this.db.query(`SELECT 1 FROM users WHERE phone=$1 AND id<>$2 AND COALESCE(phone_verified,false) LIMIT 1`, [phone, uid])).rowCount;
    if (taken) throw new BadRequestException('Số điện thoại này đã được xác minh bởi tài khoản khác.');
    const recent = (await this.db.query(`SELECT COUNT(*) FILTER (WHERE created_at > now()-interval '60 seconds')::int AS last_min, COUNT(*)::int AS last_hour FROM phone_otps WHERE user_id=$1 AND created_at > now()-interval '1 hour'`, [uid])).rows[0];
    if (recent.last_min > 0) throw new BadRequestException('Vui lòng đợi 60 giây trước khi yêu cầu mã mới.');
    if (recent.last_hour >= 5) throw new BadRequestException('Bạn đã yêu cầu mã quá nhiều lần. Hãy thử lại sau 1 giờ.');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.db.query(`UPDATE phone_otps SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL`, [uid]);
    await this.db.query(`INSERT INTO phone_otps(user_id,phone,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')`, [uid, phone, sha(`${uid}:${phone}:${code}`)]);
    const sent = await this.sendSms(phone, code);
    const dev = !sent && process.env.NODE_ENV !== 'production';
    return ok({ phone, expiresInSeconds: 300, ...(dev ? { devCode: code } : {}) }, sent ? `Đã gửi mã xác minh tới ${phone}.` : dev ? 'Chế độ thử nghiệm: chưa cấu hình SMS, mã hiển thị bên dưới.' : `Đã ghi nhận yêu cầu cho ${phone}.`);
  }
  async confirmPhone(uid: string, code: string) {
    const row = (await this.db.query(`SELECT id, phone, code_hash, attempts FROM phone_otps WHERE user_id=$1 AND consumed_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 1`, [uid])).rows[0];
    if (!row) throw new BadRequestException('Mã đã hết hạn hoặc chưa được gửi. Hãy yêu cầu mã mới.');
    if (row.attempts >= 5) throw new BadRequestException('Nhập sai quá nhiều lần. Hãy yêu cầu mã mới.');
    if (sha(`${uid}:${row.phone}:${String(code ?? '').trim()}`) !== row.code_hash) {
      await this.db.query(`UPDATE phone_otps SET attempts=attempts+1 WHERE id=$1`, [row.id]);
      throw new BadRequestException('Mã xác minh không đúng.');
    }
    await this.db.transaction(async c => {
      await c.query(`UPDATE phone_otps SET consumed_at=now() WHERE id=$1`, [row.id]);
      await c.query(`UPDATE users SET phone=$1, phone_verified=true, updated_at=now() WHERE id=$2`, [row.phone, uid]);
    });
    void this.notifications.create(uid, 'ACCOUNT_PHONE_VERIFIED', 'Đã xác minh số điện thoại', `Số điện thoại ${row.phone} đã được xác minh cho tài khoản của bạn. Hoàn tất xác minh CCCD để nhận huy hiệu “Đã xác thực”.`, 'ACCOUNT', uid).catch(() => undefined);
    return ok({ phone: row.phone, phoneVerified: true }, 'Đã xác minh số điện thoại.');
  }

  /** Xác minh SĐT bằng Firebase Phone Auth: trình duyệt đã nhập đúng mã SMS, gửi lên ID token. */
  async confirmPhoneFirebase(uid: string, idToken: string) {
    // Nạp firebase-admin khi cần, tránh kéo thư viện nặng vào mọi nơi dùng VerificationService.
    const { toLocalPhone, verifyFirebasePhone } = await import('../auth/firebase-phone');
    const phone = normalizePhone(toLocalPhone(await verifyFirebasePhone(idToken)));
    if (!phone) throw new BadRequestException('Số điện thoại không hợp lệ.');
    const taken = (await this.db.query(`SELECT 1 FROM users WHERE phone=$1 AND id<>$2 AND COALESCE(phone_verified,false) LIMIT 1`, [phone, uid])).rowCount;
    if (taken) throw new BadRequestException('Số điện thoại này đã được xác minh bởi tài khoản khác.');
    await this.db.query(`UPDATE users SET phone=$1, phone_verified=true, updated_at=now() WHERE id=$2`, [phone, uid]);
    void this.notifications.create(uid, 'ACCOUNT_PHONE_VERIFIED', 'Đã xác minh số điện thoại', `Số điện thoại ${phone} đã được xác minh cho tài khoản của bạn. Hoàn tất xác minh CCCD để nhận huy hiệu “Đã xác thực”.`, 'ACCOUNT', uid).catch(() => undefined);
    return ok({ phone, phoneVerified: true }, 'Đã xác minh số điện thoại.');
  }

  /** Người dùng gửi SĐT để quản trị viên duyệt thủ công (không dùng OTP). */
  async requestPhoneReview(uid: string, rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw new BadRequestException('Số điện thoại không hợp lệ. Ví dụ: 0912345678.');
    const me = (await this.db.query(`SELECT full_name, phone, COALESCE(phone_verified,false) AS pv FROM users WHERE id=$1`, [uid])).rows[0];
    if (!me) throw new NotFoundException('Không tìm thấy tài khoản');
    if (me.pv && me.phone === phone) throw new BadRequestException('Số điện thoại này đã được xác minh.');
    if ((await this.db.query(`SELECT 1 FROM users WHERE phone=$1 AND id<>$2 AND COALESCE(phone_verified,false) LIMIT 1`, [phone, uid])).rowCount) throw new BadRequestException('Số điện thoại này đã được xác minh bởi tài khoản khác.');
    if ((await this.db.query(`SELECT 1 FROM phone_verifications WHERE user_id=$1 AND status='PENDING'`, [uid])).rowCount) throw new BadRequestException('Yêu cầu xác minh số điện thoại của bạn đang chờ duyệt.');
    if (((await this.db.query(`SELECT COUNT(*)::int AS n FROM phone_verifications WHERE user_id=$1 AND created_at > now()-interval '1 day'`, [uid])).rows[0].n as number) >= 5) throw new BadRequestException('Bạn đã gửi quá nhiều yêu cầu hôm nay. Vui lòng thử lại sau.');
    const row = (await this.db.query(`INSERT INTO phone_verifications(user_id,phone) VALUES($1,$2) RETURNING id`, [uid, phone])).rows[0];
    void this.notifyAdmins('ADMIN_PHONE_VERIFY_REQUEST', 'Yêu cầu xác minh số điện thoại', `${me.full_name || 'Người dùng'} gửi số ${phone} để xác minh.`, row.id);
    return ok({ id: row.id, phone, status: 'PENDING' }, 'Đã gửi yêu cầu. Quản trị viên sẽ duyệt và thông báo cho bạn sớm.');
  }

  /** Thông báo (đẩy + trong ứng dụng) tới mọi quản trị viên. */
  private async notifyAdmins(type: string, title: string, content: string, refId: string) {
    try {
      const admins = (await this.db.query(`SELECT id FROM users WHERE role IN ('ADMIN'::user_role, 'SUPER_ADMIN'::user_role)`)).rows as { id: string }[];
      await Promise.all(admins.map(a => this.notifications.create(a.id, type, title, content, 'VERIFICATION', refId).catch(() => undefined)));
    } catch (e) { this.log.warn('Không gửi được thông báo cho admin: ' + (e instanceof Error ? e.message : String(e))); }
  }

  async adminPhoneList(status: string, page: number) {
    const st = ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? status : null;
    const p = Math.max(1, page || 1);
    const rows = (await this.db.query(`SELECT v.id, v.user_id, v.phone, v.status, v.reject_reason, v.created_at, u.full_name, u.email FROM phone_verifications v JOIN users u ON u.id=v.user_id WHERE ($1::text IS NULL OR v.status=$1) ORDER BY (v.status='PENDING') DESC, v.created_at ${st === 'PENDING' || !st ? 'ASC' : 'DESC'} LIMIT 20 OFFSET $2`, [st, (p - 1) * 20])).rows;
    const stats = (await this.db.query(`SELECT COUNT(*) FILTER (WHERE status='PENDING')::int AS pending FROM phone_verifications`)).rows[0];
    return ok({ items: rows, stats });
  }
  async adminPhoneReview(adminId: string, id: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    if (action === 'REJECT' && String(reason ?? '').trim().length < 3) throw new BadRequestException('Vui lòng nhập lý do từ chối.');
    const row = await this.db.transaction(async c => {
      const v = (await c.query(`SELECT id, user_id, phone FROM phone_verifications WHERE id=$1 AND status='PENDING' FOR UPDATE`, [id])).rows[0];
      if (!v) throw new BadRequestException('Yêu cầu không còn ở trạng thái chờ duyệt.');
      if (action === 'APPROVE' && (await c.query(`SELECT 1 FROM users WHERE phone=$1 AND id<>$2 AND COALESCE(phone_verified,false) LIMIT 1`, [v.phone, v.user_id])).rowCount) throw new BadRequestException('Số này đã được xác minh bởi tài khoản khác. Hãy từ chối kèm lý do.');
      await c.query(`UPDATE phone_verifications SET status=$2, reject_reason=$3, reviewed_by=$4, reviewed_at=now() WHERE id=$1`, [id, action === 'APPROVE' ? 'APPROVED' : 'REJECTED', action === 'REJECT' ? String(reason).trim() : null, adminId]);
      if (action === 'APPROVE') await c.query(`UPDATE users SET phone=$1, phone_verified=true, updated_at=now() WHERE id=$2`, [v.phone, v.user_id]);
      return v;
    });
    void this.audit?.log(adminId, 'Admin', action === 'APPROVE' ? 'PHONE_APPROVED' : 'PHONE_REJECTED', 'User', row.user_id, { verificationId: id, reason: reason ?? null });
    void this.notifications.create(row.user_id, action === 'APPROVE' ? 'ACCOUNT_PHONE_VERIFIED' : 'IDENTITY_REJECTED', action === 'APPROVE' ? 'Đã xác minh số điện thoại' : 'Xác minh số điện thoại bị từ chối', action === 'APPROVE' ? `Số điện thoại ${row.phone} đã được xác minh cho tài khoản của bạn. Hoàn tất xác minh CCCD để nhận huy hiệu “Đã xác thực”.` : `Số điện thoại ${row.phone} chưa được xác minh. Lý do: ${String(reason).trim()}. Bạn có thể gửi lại yêu cầu.`, 'ACCOUNT', row.user_id).catch(() => undefined);
    return ok({ id, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }, action === 'APPROVE' ? 'Đã duyệt số điện thoại.' : 'Đã từ chối số điện thoại.');
  }

  // ---------- CCCD ----------
  async submitIdentity(uid: string, body: { fullName?: string; idNumber?: string }, files: { front?: Img; back?: Img; selfie?: Img }) {
    const fullName = String(body.fullName ?? '').trim();
    const idNumber = String(body.idNumber ?? '').replace(/\s/g, '');
    if (fullName.length < 3 || fullName.length > 100) throw new BadRequestException('Vui lòng nhập họ tên đúng như trên giấy tờ.');
    if (!/^(\d{9}|\d{12})$/.test(idNumber)) throw new BadRequestException('Số CMND/CCCD phải gồm 9 hoặc 12 chữ số.');
    if (!files.front || !files.back || !files.selfie) throw new BadRequestException('Cần đủ 3 ảnh: mặt trước, mặt sau giấy tờ và ảnh chân dung cầm giấy tờ.');
    const u = (await this.db.query(`SELECT COALESCE(is_verified,false) AS v FROM users WHERE id=$1`, [uid])).rows[0];
    if (u?.v) throw new BadRequestException('Tài khoản của bạn đã được xác minh danh tính.');
    if ((await this.db.query(`SELECT 1 FROM identity_verifications WHERE user_id=$1 AND status='PENDING'`, [uid])).rowCount) throw new BadRequestException('Hồ sơ của bạn đang chờ duyệt.');
    const hash = sha(`id:${idNumber}`);
    if ((await this.db.query(`SELECT 1 FROM identity_verifications WHERE id_hash=$1 AND status='APPROVED' AND user_id<>$2`, [hash, uid])).rowCount) throw new BadRequestException('Số giấy tờ này đã được dùng để xác minh cho tài khoản khác.');
    const [front, back, selfie] = await Promise.all([this.storage.uploadPrivate(BUCKET, uid, files.front), this.storage.uploadPrivate(BUCKET, uid, files.back), this.storage.uploadPrivate(BUCKET, uid, files.selfie)]);
    const row = (await this.db.query(`INSERT INTO identity_verifications(user_id,full_name,id_last4,id_hash,front_key,back_key,selfie_key) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [uid, fullName, idNumber.slice(-4), hash, front, back, selfie])).rows[0];
    void this.notifyAdmins('ADMIN_IDENTITY_REQUEST', 'Hồ sơ xác minh CCCD mới', `${fullName} gửi hồ sơ CCCD chờ duyệt.`, row.id);
    return ok({ id: row.id, status: 'PENDING' }, 'Đã gửi hồ sơ. Chúng tôi sẽ duyệt trong vòng 24 giờ.');
  }

  // ---------- Admin ----------
  async adminList(status: string, page: number) {
    const st = ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? status : null;
    const p = Math.max(1, page || 1);
    const rows = (await this.db.query(`SELECT v.id, v.user_id, v.full_name, v.id_last4, v.status, v.reject_reason, v.created_at, u.email, u.phone, COALESCE(u.phone_verified,false) AS phone_verified
      FROM identity_verifications v JOIN users u ON u.id=v.user_id WHERE ($1::text IS NULL OR v.status=$1) ORDER BY (v.status='PENDING') DESC, v.created_at ${st === 'PENDING' || !st ? 'ASC' : 'DESC'} LIMIT 20 OFFSET $2`, [st, (p - 1) * 20])).rows;
    const stats = (await this.db.query(`SELECT COUNT(*) FILTER (WHERE status='PENDING')::int AS pending, COUNT(*) FILTER (WHERE status='APPROVED')::int AS approved, COUNT(*) FILTER (WHERE status='REJECTED')::int AS rejected FROM identity_verifications`)).rows[0];
    return ok({ items: rows, stats });
  }
  async adminDetail(id: string) {
    const v = (await this.db.query(`SELECT * FROM identity_verifications WHERE id=$1`, [id])).rows[0];
    if (!v) throw new NotFoundException('Không tìm thấy hồ sơ');
    const [front, back, selfie] = await Promise.all([v.front_key, v.back_key, v.selfie_key].map((k: string) => this.storage.signedUrl(BUCKET, k)));
    return ok({ id: v.id, userId: v.user_id, fullName: v.full_name, idLast4: v.id_last4, status: v.status, rejectReason: v.reject_reason, images: { front, back, selfie } });
  }
  async adminReview(adminId: string, id: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    if (action === 'REJECT' && String(reason ?? '').trim().length < 3) throw new BadRequestException('Vui lòng nhập lý do từ chối.');
    const row = await this.db.transaction(async c => {
      const v = (await c.query(`SELECT id, user_id FROM identity_verifications WHERE id=$1 AND status='PENDING' FOR UPDATE`, [id])).rows[0];
      if (!v) throw new BadRequestException('Hồ sơ không còn ở trạng thái chờ duyệt.');
      await c.query(`UPDATE identity_verifications SET status=$2, reject_reason=$3, reviewed_by=$4, reviewed_at=now() WHERE id=$1`, [id, action === 'APPROVE' ? 'APPROVED' : 'REJECTED', action === 'REJECT' ? String(reason).trim() : null, adminId]);
      if (action === 'APPROVE') await c.query(`UPDATE users SET is_verified=true, updated_at=now() WHERE id=$1`, [v.user_id]);
      return v;
    });
    void this.audit?.log(adminId, 'Admin', action === 'APPROVE' ? 'IDENTITY_APPROVED' : 'IDENTITY_REJECTED', 'User', row.user_id, { verificationId: id, reason: reason ?? null });
    void this.notifications.create(row.user_id, action === 'APPROVE' ? 'ACCOUNT_VERIFIED' : 'IDENTITY_REJECTED', action === 'APPROVE' ? 'Đã xác minh danh tính' : 'Hồ sơ xác minh bị từ chối', action === 'APPROVE' ? 'Tài khoản của bạn đã có huy hiệu Đã xác thực.' : `Lý do: ${String(reason).trim()}. Bạn có thể gửi lại hồ sơ.`, 'USER', row.user_id).catch(() => undefined);
    return ok({ id, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }, action === 'APPROVE' ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.');
  }
  async pendingCount() { return (await this.db.query(`SELECT (SELECT COUNT(*) FROM identity_verifications WHERE status='PENDING')::int + (SELECT COUNT(*) FROM phone_verifications WHERE status='PENDING')::int AS n`)).rows[0].n as number; }
}
