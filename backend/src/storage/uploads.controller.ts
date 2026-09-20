import { BadRequestException, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from './storage.service';
@Controller('uploads') export class UploadsController {
  constructor(private readonly storage: StorageService) {}
  @Post('product-image') @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async productImage(@Req() request: { user: { id: string } }, @UploadedFile() file?: { buffer: Buffer; mimetype: string }) {
    if (!file) throw new BadRequestException('Thiếu tệp ảnh'); return { success: true, data: await this.storage.uploadProductImage(request.user.id, file), message: null, errorCode: null };
  }
}
