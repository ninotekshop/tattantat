import { IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class LoginDto { @IsString() @IsNotEmpty() phoneOrEmail!: string; @IsString() @MinLength(8) password!: string; }
export class RegisterDto { @IsString() @MinLength(2) fullName!: string; @IsPhoneNumber('VN') phone!: string; @IsString() @MinLength(8) password!: string; }
export class VerifyOtpDto { @IsString() verificationId!: string; @IsString() @MinLength(6) otp!: string; }
export class RefreshDto { @IsString() refreshToken!: string; }
