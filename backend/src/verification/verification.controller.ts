import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { VerificationService } from './verification.service';

class PhoneDto { @IsString() @MaxLength(20) phone!: string; }
class CodeDto { @IsString() @MaxLength(10) code!: string; }
class FirebaseTokenDto { @IsString() @MaxLength(4096) idToken!: string; }
class ReviewDto { @IsIn(['APPROVE', 'REJECT']) action!: 'APPROVE' | 'REJECT'; @IsOptional() @IsString() @MaxLength(500) reason?: string; }
type Img = { buffer: Buffer; mimetype: string };
const uuid = (id: string) => { if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Mã hồ sơ không hợp lệ'); return id; };

@Controller('me/verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly svc: VerificationService) {}
  @Get() status(@Req() r: { user: { id: string } }) { return this.svc.status(r.user.id); }
  @Post('phone/send') send(@Req() r: { user: { id: string } }, @Body() b: PhoneDto) { return this.svc.sendPhoneOtp(r.user.id, b.phone); }
  @Post('phone/firebase-confirm') firebaseConfirm(@Req() r: { user: { id: string } }, @Body() b: FirebaseTokenDto) { return this.svc.confirmPhoneFirebase(r.user.id, b.idToken); }
  @Post('phone/confirm') confirm(@Req() r: { user: { id: string } }, @Body() b: CodeDto) { return this.svc.confirmPhone(r.user.id, b.code); }
  @Post('identity')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }, { name: 'selfie', maxCount: 1 }], { limits: { fileSize: 8 * 1024 * 1024 } }))
  identity(@Req() r: { user: { id: string } }, @Body() b: { fullName?: string; idNumber?: string }, @UploadedFiles() f: { front?: Img[]; back?: Img[]; selfie?: Img[] }) {
    return this.svc.submitIdentity(r.user.id, b, { front: f?.front?.[0], back: f?.back?.[0], selfie: f?.selfie?.[0] });
  }
}

@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminVerificationController {
  constructor(private readonly svc: VerificationService) {}
  @Get() list(@Query('status') status = 'PENDING', @Query('page') page = '1') { return this.svc.adminList(status, Number(page)); }
  @Get('pending-count') async count() { return { success: true, data: { pending: await this.svc.pendingCount() }, message: null, errorCode: null }; }
  @Get(':id') detail(@Param('id') id: string) { return this.svc.adminDetail(uuid(id)); }
  @Post(':id/review') review(@Req() r: { user: { id: string } }, @Param('id') id: string, @Body() b: ReviewDto) { return this.svc.adminReview(r.user.id, uuid(id), b.action, b.reason); }
}
