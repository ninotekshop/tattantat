import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @Throttle({ default: { limit: 5, ttl: 60_000 } }) login(@Body() body: LoginDto) { return this.auth.login(body); }
  @Post('register') @Throttle({ default: { limit: 3, ttl: 60_000 } }) register(@Body() body: RegisterDto) { return this.auth.register(body); }
  @Post('verify-otp') verifyOtp(@Body() body: VerifyOtpDto) { return this.auth.verifyOtp(body); }
  @Post('refresh') refresh(@Body() body: RefreshDto) { return this.auth.refresh(body); }
}
