import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto, SendOtpDto, ForgotPasswordDto, ResetPasswordDto, SocialLoginDto } from './dto/auth.dto';

const DEFAULT_JWT_REFRESH = 'tat_tan_tat_jwt_refresh_secret_key_2026';

type UserRow = {
  id: string;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  full_name: string;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
};

const resetTokens = new Map<string, { userId: string; email: string; expiresAt: number }>();
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
    return this.envelope(await this.tokensFor(user));
  }

  async register(body: RegisterDto) {
    const email = body.email?.trim().toLowerCase() || null;
    const phone = body.phone?.trim() || null;
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
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, user.full_name],
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

  async sendOtp(body: SendOtpDto) {
    const phone = body.phone.trim();
    const otp = this.config.get<string>('DEV_OTP_CODE') || '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(phone, { phone, otp, expiresAt });
    return this.envelope({ phone, expiresAt }, `Đã gửi mã OTP tới số ${phone}`);
  }

  async verifyOtp(body: VerifyOtpDto) {
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

  async forgotPassword(body: ForgotPasswordDto) {
    const email = body.email.trim().toLowerCase();
    const result = await this.database.query<UserRow>(
      `SELECT id, email, full_name FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );
    const user = result.rows[0];

    if (user && user.email) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000;
      resetTokens.set(token, { userId: user.id, email: user.email, expiresAt });

      this.mailService.sendPasswordResetEmail(user.email, user.full_name, token).catch(() => {});
    }

    return this.envelope(
      null,
      'Nếu email này được đăng ký tại Tất Tần Tật, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.',
    );
  }

  async resetPassword(body: ResetPasswordDto) {
    const record = resetTokens.get(body.token);
    if (!record || record.expiresAt < Date.now()) {
      throw new BadRequestException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await this.database.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, record.userId]);
    resetTokens.delete(body.token);

    return this.envelope(null, 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
  }

  async socialLogin(body: SocialLoginDto) {
    let email = body.email?.trim().toLowerCase() || null;
    let name = body.name || `Thành viên ${body.provider === 'google' ? 'Google' : body.provider === 'facebook' ? 'Facebook' : 'Apple'}`;
    let avatarUrl = body.avatarUrl || null;

    // 1. Verify Google ID Token if provided
    if (body.provider === 'google' && body.idToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${body.idToken}`);
        if (verifyRes.ok) {
          const googlePayload = await verifyRes.json();
          if (googlePayload?.email) {
            email = googlePayload.email.toLowerCase();
            name = googlePayload.name || name;
            avatarUrl = googlePayload.picture || avatarUrl;
          }
        }
      } catch (err) {}
    }

    // 2. Verify Facebook Access Token via Meta Graph API if provided
    if (body.provider === 'facebook' && (body.accessToken || body.idToken)) {
      const fbToken = body.accessToken || body.idToken;
      try {
        const verifyRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbToken}`);
        if (verifyRes.ok) {
          const fbPayload = await verifyRes.json();
          if (fbPayload?.email) {
            email = fbPayload.email.toLowerCase();
          }
          if (fbPayload?.name) {
            name = fbPayload.name;
          }
          if (fbPayload?.picture?.data?.url) {
            avatarUrl = fbPayload.picture.data.url;
          }
        }
      } catch (err) {}
    }

    // 3. Decode Apple ID Token if provided
    if (body.provider === 'apple' && body.idToken) {
      try {
        const payloadBase64 = body.idToken.split('.')[1];
        if (payloadBase64) {
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const applePayload = JSON.parse(payloadJson);
          if (applePayload?.email) {
            email = applePayload.email.toLowerCase();
          }
        }
      } catch (err) {}
    }

    let user: UserRow | null = null;

    if (email) {
      const res = await this.database.query<UserRow>(
        `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status FROM users WHERE LOWER(email) = $1 LIMIT 1`,
        [email],
      );
      user = res.rows[0] || null;
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
    } else if (avatarUrl && !user.avatar_url) {
      await this.database.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, user.id]);
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
