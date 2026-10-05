import { Body, Controller, Get, NotFoundException, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { authorizeUrl, identityFromCode, oauthConfig, readState, safeReturnUrl, signState, type WebProvider } from './oauth-web';
import { CheckEmailDto, CheckPhoneDto, LoginDto, RegisterDto, RefreshDto, VerifyOtpDto, SendOtpDto, FirebasePhoneDto, ForgotPasswordDto, ResetPasswordDto, SocialLoginDto } from './dto/auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post('phone/check')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkPhone(@Body() body: CheckPhoneDto) {
    return this.auth.checkPhone(body.phone);
  }

  @Post('email/check')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkEmail(@Body() body: CheckEmailDto) {
    return this.auth.checkEmail(body.email);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post('phone/send-otp')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendOtp(@Body() body: SendOtpDto) {
    return this.auth.sendOtp(body);
  }

  @Post('phone/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.auth.verifyOtp(body);
  }

  @Post('phone/firebase-login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  firebaseLogin(@Body() body: FirebasePhoneDto) {
    return this.auth.firebasePhoneLogin(body.idToken);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body);
  }

  @Post('reset-password/check')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkResetToken(@Body() body: { token?: string }) {
    return this.auth.checkResetToken(String(body?.token ?? '').slice(0, 200));
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }

  @Post('social')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  socialLogin(@Body() body: SocialLoginDto) {
    return this.auth.socialLogin(body);
  }

  /** Bắt đầu đăng nhập Facebook/Zalo: app mở đường dẫn này trong trình duyệt, máy chủ chuyển sang trang đăng nhập của nhà cung cấp. */
  @Get('oauth/:provider/start')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  oauthStart(@Param('provider') provider: string, @Query('returnUrl') returnUrl: string, @Req() req: any, @Res() res: any) {
    if (provider !== 'facebook' && provider !== 'zalo') throw new NotFoundException();
    const back = safeReturnUrl(returnUrl);
    const url = authorizeUrl(provider, this.auth.oauthSecret, this.oauthRedirectUri(req, provider), signState(this.auth.oauthSecret, back));
    return res.redirect(302, url ?? `${back}${back.includes('?') ? '&' : '?'}error=${encodeURIComponent('Đăng nhập ' + (provider === 'zalo' ? 'Zalo' : 'Facebook') + ' chưa được cấu hình.')}`);
  }

  @Get('oauth/:provider/callback')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async oauthCallback(@Param('provider') provider: string, @Query() q: Record<string, string>, @Req() req: any, @Res() res: any) {
    if (provider !== 'facebook' && provider !== 'zalo') throw new NotFoundException();
    const st = readState(this.auth.oauthSecret, q.state);
    const back = st?.returnUrl ?? 'tattantat://oauth';
    const go = (params: Record<string, string>) => res.redirect(302, `${back}${back.includes('?') ? '&' : '?'}${new URLSearchParams(params)}`);
    if (!st) return go({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.' });
    if (!q.code) return go({ error: 'Bạn đã hủy đăng nhập.' });
    try {
      if (!oauthConfig(provider as WebProvider).secret) return go({ error: 'Đăng nhập này chưa được cấu hình trên máy chủ.' });
      const identity = await identityFromCode(provider as WebProvider, this.auth.oauthSecret, this.oauthRedirectUri(req, provider), q.code, st.nonce);
      if (!identity) return go({ error: 'Không xác thực được tài khoản. Vui lòng thử lại.' });
      return go({ code: await this.auth.oauthLoginCode(provider as WebProvider, identity) });
    } catch (e) {
      return go({ error: (e as Error).message || 'Đăng nhập chưa thành công. Vui lòng thử lại.' });
    }
  }

  @Post('oauth/exchange')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  oauthExchange(@Body() body: { code: string }) {
    return this.auth.oauthExchange(body?.code);
  }

  /** Địa chỉ callback phải trùng với địa chỉ khai báo trong Facebook/Zalo. Đặt PUBLIC_API_URL nếu máy chủ nằm sau proxy. */
  private oauthRedirectUri(req: any, provider: string) {
    const base = (process.env.PUBLIC_API_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}/${process.env.API_PREFIX ?? 'api/v1'}`).replace(/\/$/, '');
    return `${base}/auth/oauth/${provider}/callback`;
  }

  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body);
  }

  @Post('logout')
  logout(@Body() body: RefreshDto) {
    return this.auth.logout(body);
  }
}
