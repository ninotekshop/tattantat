import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { optimizeImage } from '../media/image-processor';

@Injectable()
export class StorageService {
  private readonly client;
  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const key = config.get<string>('SUPABASE_SECRET_KEY') || config.get<string>('SUPABASE_PUBLISHABLE_KEY') || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url) throw new Error('Thiếu SUPABASE_URL trong backend/.env.');
    if (!key) throw new Error('Thiếu SUPABASE_SECRET_KEY trong backend/.env (không lưu khóa trong mã nguồn).');
    this.client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  async uploadProductImage(userId: string, file: { buffer: Buffer; mimetype: string }) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP');
    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'; const key = `${userId}/${randomUUID()}.${extension}`;
    const { error } = await this.client.storage.from('product-images').upload(key, (await optimizeImage(file)).buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException('Không thể tải ảnh lên'); return { key };
  }
  /** Kho riêng tư cho giấy tờ định danh; chỉ truy cập qua đường dẫn ký có hạn. */
  async ensurePrivateBucket(name: string) { try { await this.client.storage.createBucket(name, { public: false }); } catch { /* đã tồn tại */ } }
  async uploadPrivate(bucket: string, userId: string, file: { buffer: Buffer; mimetype: string }) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP');
    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'; const key = `${userId}/${randomUUID()}.${extension}`;
    const { error } = await this.client.storage.from(bucket).upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException('Không thể tải ảnh lên'); return key;
  }
  async signedUrl(bucket: string, key: string, seconds = 300): Promise<string | null> {
    const { data } = await this.client.storage.from(bucket).createSignedUrl(key, seconds); return data?.signedUrl ?? null;
  }

  /** Ảnh/video trong khung chat: kho riêng tư, chỉ xem qua đường dẫn ký có hạn. */
  private chatUrls = new Map<string, { url: string; at: number }>();
  async uploadChatMedia(userId: string, file: { buffer: Buffer; mimetype: string }, kind: 'IMAGE' | 'VIDEO') {
    await this.ensurePrivateBucket('chat-media');
    const ext = kind === 'IMAGE' ? (file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg') : (file.mimetype === 'video/webm' ? 'webm' : file.mimetype === 'video/quicktime' ? 'mov' : 'mp4');
    const key = `${userId}/${randomUUID()}.${ext}`;
    const body = kind === 'IMAGE' ? (await optimizeImage(file)).buffer : file.buffer;
    const { error } = await this.client.storage.from('chat-media').upload(key, body, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException(kind === 'IMAGE' ? 'Không thể tải ảnh lên' : 'Không thể tải video lên');
    return key;
  }
  /** URL ổn định trong ~45 phút (tránh ảnh tải lại liên tục khi trang tự làm mới). */
  async chatMediaUrl(key: string): Promise<string | null> {
    const hit = this.chatUrls.get(key);
    if (hit && Date.now() - hit.at < 45 * 60_000) return hit.url;
    const url = await this.signedUrl('chat-media', key, 3600);
    if (url) { if (this.chatUrls.size > 2000) this.chatUrls.clear(); this.chatUrls.set(key, { url, at: Date.now() }); }
    return url;
  }
}
