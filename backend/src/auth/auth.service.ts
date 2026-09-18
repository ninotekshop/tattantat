import { Injectable, NotImplementedException } from '@nestjs/common';
import { LoginDto, RegisterDto, RefreshDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  login(_body: LoginDto) { throw new NotImplementedException('Auth database integration is pending'); }
  register(_body: RegisterDto) { throw new NotImplementedException('Auth database integration is pending'); }
  verifyOtp(_body: VerifyOtpDto) { throw new NotImplementedException('OTP provider integration is pending'); }
  refresh(_body: RefreshDto) { throw new NotImplementedException('JWT refresh-token rotation is pending'); }
}
