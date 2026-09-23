import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phoneOrEmail!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsBoolean()
  @IsOptional()
  termsAgreed?: boolean;
}

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsOptional()
  verificationId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  otp!: string;
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class SocialLoginDto {
  @IsString()
  @IsNotEmpty()
  provider!: 'google' | 'facebook' | 'apple';

  @IsString()
  @IsNotEmpty()
  providerAccountId!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  idToken?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
