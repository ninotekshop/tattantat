import { optimizeImage } from '../media/image-processor';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export function detectMedia(buffer: Buffer, kind: 'images'|'videos'): string | null {
  if (kind==='images') {
    if (buffer.subarray(0,3).equals(Buffer.from([255,216,255]))) return 'image/jpeg';
    if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
    if (buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp';
  } else {
    if (buffer.toString('ascii',4,8)==='ftyp') return 'video/mp4';
    if (buffer.subarray(0,4).equals(Buffer.from([26,69,223,163]))) return 'video/webm';
  }
  return null;
}

@Injectable()
export class ListingMediaService {
  private readonly client;
  private readonly bucket = 'listing-media';
  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const key = config.get<string>('SUPABASE_SECRET_KEY') || config.get<string>('SUPABASE_PUBLISHABLE_KEY') || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url) throw new Error('Thiếu SUPABASE_URL trong backend/.env.');
    if (!key) throw new Error('Thiếu SUPABASE_SECRET_KEY trong backend/.env (không lưu khóa trong mã nguồn).');
    this.client=createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false},realtime:{transport:class NoRealtime {} as any}});
  }
  async upload(userId: string, listingId: string, kind: 'images'|'videos', file: {buffer:Buffer;mimetype:string}) {
    const mime=detectMedia(file.buffer,kind);
    if (!mime || mime!==file.mimetype || !file.buffer.length || file.buffer.length>(kind==='images'?10:50)*1024*1024) throw new BadRequestException('Định dạng hoặc dung lượng tệp không hợp lệ.');
    const body=kind==='images'?(await optimizeImage(file)).buffer:file.buffer;
    const key=userId+'/'+listingId+'/'+randomUUID()+'.'+mime.split('/')[1];
    const {error}=await this.client.storage.from(this.bucket).upload(key,body,{contentType:mime,upsert:false});
    if(error) throw new ServiceUnavailableException('Không thể tải tệp. Kiểm tra cấu hình kho listing-media.');
    return {key,mime,size:body.length};
  }
  async signed(key: string) {
    const {data,error}=await this.client.storage.from(this.bucket).createSignedUrl(key,900);
    if(error||!data) {
      console.warn('[ListingMedia] createSignedUrl lỗi — bucket='+this.bucket+', key='+key+', chi tiết: '+(error?.message ?? 'không có dữ liệu')+' (status='+((error as any)?.statusCode ?? (error as any)?.status ?? '?')+')');
      throw new ServiceUnavailableException('Không thể mở tệp. Vui lòng thử lại.');
    }
    return data.signedUrl;
  }
  async remove(key:string) {
    const {error}=await this.client.storage.from(this.bucket).remove([key]);
    if(error) throw new ServiceUnavailableException('Chưa thể xóa tệp khỏi kho lưu trữ. Hãy thử lại.');
  }
}
