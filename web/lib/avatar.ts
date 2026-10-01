export const AVATAR_MAX_INPUT = 8 * 1024 * 1024;

/** Cắt vuông giữa ảnh, thu nhỏ còn 256x256 và trả về data URL JPEG (~20-40KB). */
export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
  if (file.size > AVATAR_MAX_INPUT) throw new Error('Ảnh quá lớn (tối đa 8MB).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('Không đọc được ảnh này.')); i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}
