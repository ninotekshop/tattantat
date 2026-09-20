import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto } from './dto/auth.dto';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(body: LoginDto) {
    const result = await this.database.query<UserRow>(
      `SELECT id, phone, email, password_hash, full_name, avatar_url, role, status
       FROM users WHERE phone = $1 OR email = $1 LIMIT 1`,
      [body.phoneOrEmail.trim()],
    );
    const user = result.rows[0];
    if (!user?.password_hash || user.status !== 'ACTIVE' || !(await bcrypt.compare(body.password, user.password_hash))) {
      throw new UnauthorizedException('Số điện thoại/email hoặc mật khẩu không đúng');
    }
    await this.database.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    return this.envelope(await this.tokensFor(user));
  }

  async register(body: RegisterDto) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    try {
      const result = await this.database.query<UserRow>(
        `INSERT INTO users (phone, full_name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, phone, email, password_hash, full_name, avatar_url, role, status`,
        [body.phone.trim(), body.fullName.trim(), passwordHash],
      );
      const user = result.rows[0];
      await this.database.query(
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
        [user.id, user.full_name],
      );
      const verification = await this.database.query<{ id: string }>(
        `INSERT INTO user_verifications (user_id, verification_type)
         VALUES ($1, 'PHONE') RETURNING id`,
        [user.id],
      );
      return this.envelope({ verificationId: verification.rows[0].id });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
      throw error;
    }
  }

  async verifyOtp(body: VerifyOtpDto) {
    if ((this.config.get<string>('NODE_ENV') ?? 'development') !== 'development') {
      throw new ServiceUnavailableException('OTP provider is not configured');
    }
    const expectedOtp = this.config.get<string>('DEV_OTP_CODE') ?? '123456';
    if (body.otp !== expectedOtp) throw new BadRequestException('Mã OTP không đúng');

    const result = await this.database.query<UserRow>(
      `SELECT u.id, u.phone, u.email, u.password_hash, u.full_name, u.avatar_url, u.role, u.status
       FROM user_verifications v JOIN users u ON u.id = v.user_id
       WHERE v.id = $1 AND v.verification_type = 'PHONE' AND v.status = 'PENDING' LIMIT 1`,
      [body.verificationId],
    );
    const user = result.rows[0];
    if (!user) throw new BadRequestException('Yêu cầu OTP không còn hiệu lực');

    await this.database.query(
      `UPDATE user_verifications SET status = 'VERIFIED', verified_at = NOW()
       WHERE id = $1`,
      [body.verificationId],
    );
    await this.database.query('UPDATE users SET phone_verified = TRUE WHERE id = $1', [user.id]);
    return this.envelope(await this.tokensFor(user));
  }

  async refresh(body: RefreshDto) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(body.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
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
      this.jwt.signAsync(claims, { expiresIn: '15m' }),
      this.jwt.signAsync({ ...claims, type: 'refresh' }, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: '30d',
      }),
    ]);
    return { accessToken, refreshToken, user: { id: user.id, fullName: user.full_name, avatarUrl: user.avatar_url } };
  }

  private envelope<T>(data: T, message: string | null = null) {
    return { success: true, data, message, errorCode: null };
  }
}
