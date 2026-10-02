import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { toLocalPhone, phoneVariants, verifyFirebasePhone } from './firebase-phone';
import { SocialIdentity, verifyApple, verifyFacebook, verifyGoogle } from './social-verify';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto, SendOtpDto, ForgotPasswordDto, ResetPasswordDto, SocialLoginDto } from './dto/auth.dto';

const DEFAULT_JWT_REFRESH = 'tat_tan_tat_jwt_refresh_secret_key_2026';

type UserRow = {
  id: string;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  full_name: string;
  avatar_url: string | null;
  role: 'USER' | 'MOD' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
};

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const otpStore = new Map<string, { phone: string; otp: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(body: LoginDto) {
    const input = body.phoneOrEmail.trim().toLowerCase();
    const result = await this.database.query<UserRow>(
      `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status
       FROM users WHERE LOWER(email) = $1 OR phone = $1 LIMIT 1`,
      [input],
    );
    const user = result.rows[0];
    if (!user?.password_hash || user.status !== 'ACTIVE' || !(await bcrypt.compare(body.password, user.password_hash))) {
      throw new UnauthorizedException('Email/số điện thoại hoặc mật khẩu chưa chính xác.');
    }
    await this.database.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    if (user.email) this.mailService.sendLoginEmail(user.email, user.full_name, input.includes('@') ? 'Email và mật khẩu' : 'Số điện thoại và mật khẩu').catch(() => {});
    return this.envelope(await this.tokensFor(user));
  }

  /** Chuẩn hóa SĐT VN về dạng 0xxxxxxxxx để so sánh (+84901234567, 84901234567, 0901 234 567 → 0901234567). */
  private normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('84') ? '0' + digits.slice(2) : digits;
  }

  private async phoneExists(raw: string): Promise<boolean> {
    const n = this.normalizePhone(raw);
    if (!/^0\d{9}$/.test(n)) return false;
    const r = await this.database.query(
      `SELECT 1 FROM users
       WHERE phone IS NOT NULL
         AND CASE WHEN regexp_replace(phone, '\\D', '', 'g') LIKE '84%'
                  THEN '0' || substr(regexp_replace(phone, '\\D', '', 'g'), 3)
                  ELSE regexp_replace(phone, '\\D', '', 'g') END = $1
       LIMIT 1`,
      [n],
    );
    return r.rows.length > 0;
  }

  private async emailExists(raw: string): Promise<boolean> {
    const r = await this.database.query('SELECT 1 FROM users WHERE lower(email) = $1 LIMIT 1', [raw.trim().toLowerCase()]);
    return r.rows.length > 0;
  }

  async checkEmail(email: string) {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new BadRequestException('Địa chỉ email chưa hợp lệ.');
    return this.envelope({ exists: await this.emailExists(e) });
  }

  async checkPhone(phone: string) {
    const n = this.normalizePhone(phone);
    if (!/^0\d{9}$/.test(n)) throw new BadRequestException('Số điện thoại chưa hợp lệ.');
    return this.envelope({ exists: await this.phoneExists(n) });
  }

  async register(body: RegisterDto) {
    const email = body.email?.trim().toLowerCase() || null;
    const phone = body.phone?.trim() || null;
    if (email && (await this.emailExists(email))) {
      throw new ConflictException('Email đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
    }
    if (phone && (await this.phoneExists(phone))) {
      throw new ConflictException('Số điện thoại đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.');
    }
    const passwordHash = await bcrypt.hash(body.password, 12);

    try {
      const result = await this.database.query<UserRow>(
        `INSERT INTO users (phone, email, full_name, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, phone, email, password_hash, full_name, avatar_url, role, status`,
        [phone, email, body.fullName.trim(), passwordHash],
      );
      const user = result.rows[0];

      await this.database.query(
        'INSERT INTO user_profiles (user_id, display_name, address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [user.id, user.full_name, body.address?.trim() || null],
      ).catch(() => {});

      if (email) {
        this.mailService.sendWelcomeEmail(email, user.full_name).catch(() => {});
      }

      return this.envelope(await this.tokensFor(user), 'Đăng ký tài khoản thành công!');
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Email hoặc số điện thoại đã được đăng ký trên hệ thống');
      }
      throw error;
    }
  }

  /** Đăng nhập bằng OTP hiện chỉ có mã thử nghiệm cố định → TUYỆT ĐỐI không bật ở production (ai cũng vào được tài khoản của người khác). */
  private assertOtpLoginAllowed() {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Đăng nhập bằng mã OTP chưa được hỗ trợ. Vui lòng đăng nhập bằng email/mật khẩu hoặc tài khoản mạng xã hội.');
    }
  }

  async sendOtp(body: SendOtpDto) {
    this.assertOtpLoginAllowed();
    const phone = body.phone.trim();
    const otp = this.config.get<string>('DEV_OTP_CODE') || '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(phone, { phone, otp, expiresAt });
    return this.envelope({ phone, expiresAt }, `Đã gửi mã OTP tới số ${phone}`);
  }

  async verifyOtp(body: VerifyOtpDto) {
    this.assertOtpLoginAllowed();
    const phone = body.phone?.trim();
    const expectedOtp = this.config.get<string>('DEV_OTP_CODE') || '123456';

    if (body.otp !== expectedOtp && (!phone || otpStore.get(phone)?.otp !== body.otp)) {
      throw new BadRequestException('Mã OTP không chính xác hoặc đã hết hạn');
    }

    if (phone) otpStore.delete(phone);

    let result = await this.database.query<UserRow>(
      `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status
       FROM users WHERE phone = $1 LIMIT 1`,
      [phone || ''],
    );
    let user = result.rows[0];

    if (!user && phone) {
      const createRes = await this.database.query<UserRow>(
        `INSERT INTO users (phone, full_name, phone_verified)
         VALUES ($1, $2, TRUE)
         RETURNING id, phone, email, password_hash, full_name, avatar_url, role, status`,
        [phone, `Thành viên ${phone.slice(-4)}`],
      );
      user = createRes.rows[0];
    }

    if (!user) throw new BadRequestException('Xác thực OTP không thành công');

    return this.envelope(await this.tokensFor(user));
  }

  /** Đăng nhập bằng số điện thoại đã được Firebase xác minh qua SMS OTP. */
  async firebasePhoneLogin(idToken: string) {
    const local = toLocalPhone(await verifyFirebasePhone(idToken));
    const found = await this.database.query<UserRow>(`SELECT id, phone, email, password_hash, full_name, avatar_url, role, status FROM users WHERE phone = ANY($1::text[]) LIMIT 1`, [phoneVariants(local)]);
    let user = found.rows[0];
    if (user && user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đang bị khóa hoặc chưa hoạt động.');
    if (!user) {
      user = (await this.database.query<UserRow>(`INSERT INTO users (phone, full_name, phone_verified) VALUES ($1, $2, TRUE) RETURNING id, phone, email, password_hash, full_name, avatar_url, role, status`, [local, `Thành viên ${local.slice(-4)}`])).rows[0];
    } else {
      await this.database.query('UPDATE users SET phone_verified = TRUE, last_login_at = NOW() WHERE id = $1', [user.id]);
      if (user.email) this.mailService.sendLoginEmail(user.email, user.full_name, 'Mã OTP qua số điện thoại').catch(() => {});
    }
    return this.envelope(await this.tokensFor(user));
  }

  /** Mã đặt lại mật khẩu lưu trong DB (chỉ lưu hash) để mọi tiến trình máy chủ đều dùng được. */
  private resetTableReady?: Promise<unknown>;
  private ensureResetTable() {
    this.resetTableReady ??= this.database.query(`CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`)
      .catch(e => { this.resetTableReady = undefined; throw e; });
    return this.resetTableReady;
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const email = body.email.trim().toLowerCase();
    const result = await this.database.query<UserRow>(
      `SELECT id, email, full_name, status FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );
    const user = result.rows[0];

    if (user && user.email && user.status === 'ACTIVE') {
      await this.ensureResetTable();
      const token = crypto.randomBytes(32).toString('hex');
      await this.database.query(`DELETE FROM password_resets WHERE user_id = $1 OR expires_at < now() - interval '1 day'`, [user.id]);
      await this.database.query(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '15 minutes')`, [sha256(token), user.id]);
      this.mailService.sendPasswordResetEmail(user.email, user.full_name, token).catch(() => {});
    }

    return this.envelope(
      null,
      'Nếu email này được đăng ký tại Tất Tần Tật, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.',
    );
  }

  /** Kiểm tra mã trước khi hiện form (trang /reset-password). */
  async checkResetToken(token: string) {
    await this.ensureResetTable();
    const row = (await this.database.query<{ email: string | null }>(
      `SELECT u.email FROM password_resets r JOIN users u ON u.id = r.user_id WHERE r.token_hash = $1 AND r.used_at IS NULL AND r.expires_at > now() LIMIT 1`,
      [sha256(String(token ?? ''))],
    )).rows[0];
    if (!row) throw new BadRequestException('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    const email = row.email ?? '';
    const masked = email.replace(/^(.{2})[^@]*(@.*)$/, (_m, a: string, b: string) => a + '***' + b);
    return this.envelope({ email: masked });
  }

  async resetPassword(body: ResetPasswordDto) {
    await this.ensureResetTable();
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    const user = await this.database.transaction(async c => {
      const r = (await c.query<{ user_id: string }>(
        `UPDATE password_resets SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id`,
        [sha256(String(body.token ?? ''))],
      )).rows[0];
      if (!r) throw new BadRequestException('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      const u = (await c.query<{ email: string | null; full_name: string }>(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING email, full_name`, [passwordHash, r.user_id])).rows[0];
      await c.query(`DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL`, [r.user_id]);
      return u;
    });
    if (user?.email) this.mailService.sendPasswordChangedEmail(user.email, user.full_name).catch(() => {});
    return this.envelope(null, 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
  }

  async socialLogin(body: SocialLoginDto) {
    // Chỉ tin danh tính đã được nhà cung cấp xác thực; KHÔNG tin email/tên do client tự gửi.
    const token = body.provider === 'facebook' ? (body.accessToken || body.idToken) : body.idToken;
    let identity: SocialIdentity | null = null;
    try {
      if (token) identity = body.provider === 'google' ? await verifyGoogle(token) : body.provider === 'facebook' ? await verifyFacebook(token) : body.provider === 'apple' ? await verifyApple(token) : null;
    } catch { identity = null; }
    const demo = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_SOCIAL_LOGIN === '1';
    if (!identity && !demo) throw new UnauthorizedException('Không xác thực được tài khoản mạng xã hội. Vui lòng thử lại.');
    const email = identity ? identity.email : (body.email?.trim().toLowerCase() || null);
    if (!email) throw new BadRequestException('Tài khoản này chưa có email đã xác minh. Vui lòng đăng nhập bằng cách khác.');
    const name = (identity?.name || body.name || '').trim() || `Thành viên ${body.provider === 'google' ? 'Google' : body.provider === 'facebook' ? 'Facebook' : 'Apple'}`;
    const avatarUrl = identity?.avatarUrl || null;

    let user: UserRow | null = null;

    if (email) {
      const res = await this.database.query<UserRow>(
        `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status FROM users WHERE LOWER(email) = $1 LIMIT 1`,
        [email],
      );
      user = res.rows[0] || null;
      if (user && user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đang bị khóa hoặc chưa hoạt động.');
    }

    if (!user) {
      const createRes = await this.database.query<UserRow>(
        `INSERT INTO users (email, full_name, avatar_url, email_verified)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id, phone, email, password_hash, full_name, avatar_url, role, status`,
        [email, name, avatarUrl],
      );
      user = createRes.rows[0];
      if (email) {
        this.mailService.sendWelcomeEmail(email, user.full_name).catch(() => {});
      }
    } else {
      if (avatarUrl && !user.avatar_url) await this.database.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, user.id]);
      if (user.email) this.mailService.sendLoginEmail(user.email, user.full_name, `Tài khoản ${body.provider === 'google' ? 'Google' : body.provider === 'facebook' ? 'Facebook' : 'Apple'}`).catch(() => {});
    }

    const providerName = body.provider === 'google' ? 'Google' : body.provider === 'facebook' ? 'Facebook' : 'Apple';
    return this.envelope(await this.tokensFor(user), `Đăng nhập ${providerName} thành công!`);
  }

  async refresh(body: RefreshDto) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(body.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || DEFAULT_JWT_REFRESH,
      });
      if (payload.type !== 'refresh') throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
      const result = await this.database.query<UserRow>(
        `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status FROM users WHERE id = $1 LIMIT 1`,
        [payload.sub],
      );
      const user = result.rows[0];
      if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
      return this.envelope(await this.tokensFor(user));
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
  }

  logout(_body: RefreshDto) { return this.envelope(null); }

  private async tokensFor(user: UserRow) {
    const claims = { sub: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims, { expiresIn: '7d' }),
      this.jwt.signAsync({ ...claims, type: 'refresh' }, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || DEFAULT_JWT_REFRESH, expiresIn: '30d',
      }),
    ]);
    return { accessToken, refreshToken, user: { id: user.id, fullName: user.full_name, avatarUrl: user.avatar_url, role: user.role } };
  }

  private envelope<T>(data: T, message: string | null = null) {
    return { success: true, data, message, errorCode: null };
  }
}
