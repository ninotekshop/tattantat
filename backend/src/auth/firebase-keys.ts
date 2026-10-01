import { join } from 'path';

/** Các vị trí có thể đặt file khóa Firebase: thư mục chạy hiện tại và thư mục backend (kể cả khi backend chạy nhúng trong Next.js). */
export function firebaseKeyCandidates(file: string): string[] {
  return [join(process.cwd(), file), join(process.cwd(), 'backend', file), join(__dirname, '..', '..', file)];
}
