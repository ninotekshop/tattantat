import { Logger } from '@nestjs/common';

const log = new Logger('ImageProcessor');
type Img = { buffer: Buffer; mimetype: string };
let sharpLib: any | null | undefined;
function loadSharp() {
  if (sharpLib !== undefined) return sharpLib;
  try { sharpLib = require('sharp'); } catch { sharpLib = null; log.warn('Chưa cài gói "sharp": ảnh tải lên sẽ được lưu nguyên bản. Chạy "npm install sharp" trong backend để bật nén/xoay ảnh.'); }
  return sharpLib;
}

/**
 * Tối ưu ảnh đăng công khai: tự xoay theo EXIF, xóa metadata (gồm tọa độ GPS), thu nhỏ cạnh dài tối đa 1600px và nén.
 * Giữ nguyên định dạng gốc; nếu chưa cài sharp hoặc gặp lỗi thì trả lại ảnh gốc.
 */
export async function optimizeImage(file: Img, maxSide = 1600): Promise<Img> {
  const sharp = loadSharp();
  if (!sharp) return file;
  try {
    let p = sharp(file.buffer, { failOn: 'error' }).rotate().resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true });
    p = file.mimetype === 'image/png' ? p.png({ compressionLevel: 9 }) : file.mimetype === 'image/webp' ? p.webp({ quality: 82 }) : p.jpeg({ quality: 82, mozjpeg: true });
    const buffer: Buffer = await p.toBuffer();
    return buffer.length < file.buffer.length || file.buffer.length > 3 * 1024 * 1024 ? { buffer, mimetype: file.mimetype } : file;
  } catch (e) { log.warn('Không tối ưu được ảnh, dùng bản gốc: ' + (e instanceof Error ? e.message : String(e))); return file; }
}
/** Ảnh đại diện: bản 384px và bản thumbnail 96px (JPEG, vuông, xóa metadata). Trả null nếu chưa cài sharp. */
export async function makeAvatarVariants(input: Buffer): Promise<{ main: Buffer; thumb: Buffer } | null> {
  const sharp = loadSharp();
  if (!sharp) return null;
  try {
    const base = () => sharp(input, { failOn: 'error' }).rotate();
    const main: Buffer = await base().resize(384, 384, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    const thumb: Buffer = await base().resize(96, 96, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    return { main, thumb };
  } catch (e) { log.warn('Không xử lý được ảnh đại diện: ' + (e instanceof Error ? e.message : String(e))); return null; }
}
export const __resetSharpForTest = (lib?: unknown) => { sharpLib = lib as never; };
