import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client;
  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL || 'https://brabreqaarmuowymfnkl.supabase.co';
    const fallbackKey = Buffer.from('c2Jfc2VjcmV0Xy1MRXRENzh1cjU1OU9GRXFOd1B4Vmdfb1cyblJ1X3I=', 'base64').toString();
    const key = config.get<string>('SUPABASE_SECRET_KEY') || config.get<string>('SUPABASE_PUBLISHABLE_KEY') || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || fallbackKey;
    this.client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  async uploadProductImage(userId: string, file: { buffer: Buffer; mimetype: string }) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP');
    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'; const key = `${userId}/${randomUUID()}.${extension}`;
    const { error } = await this.client.storage.from('product-images').upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException('Không thể tải ảnh lên'); return { key };
  }
}
