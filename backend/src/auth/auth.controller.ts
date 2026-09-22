import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto, SendOtpDto, ForgotPasswordDto, ResetPasswordDto, SocialLoginDto } from './dto/auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
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

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }

  @Post('social')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  socialLogin(@Body() body: SocialLoginDto) {
    return this.auth.socialLogin(body);
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
