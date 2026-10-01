import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

// Load environment variables synchronously
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/[–—]/g, '-');
}

if (!process.env.SUPABASE_URL) throw new Error('Thiếu SUPABASE_URL trong backend/.env (ví dụ https://<mã-dự-án>.supabase.co).');
if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL. Hãy khai báo trong backend/.env (không lưu mật khẩu trong mã nguồn).');
}

import { AppModule } from './app.module';
import { ErrorAlertFilter } from './ops/error-alert.filter';

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;
  const server = express();
  const httpServer = http.createServer(server);

  // Server nghe cổng ngay từ đầu, trong khi Nest còn đang khởi tạo (guard/throttler chưa sẵn sàng).
  // Request đến sớm sẽ gây lỗi "this.throttlers is not iterable", nên trả 503 rõ ràng cho tới khi app.init() xong.
  let ready = false;
  const apiPrefix = '/' + (process.env.API_PREFIX ?? 'api/v1').replace(/^\/+|\/+$/g, '');
  server.use((req, res, next) => {
    if (ready || !req.path.startsWith(apiPrefix)) return next();
    res.setHeader('Retry-After', '3');
    res.status(503).json({ success: false, message: 'Máy chủ đang khởi động, vui lòng thử lại sau vài giây.', errorCode: 'STARTING' });
  });

  if (process.env.TTT_EMBED_BACKEND === '1') {
    // Chạy nhúng trong tiến trình Next.js (Hostinger): không mở cổng, Next giao /api/v1/* cho handler này.
    (global as any).__TTT_BACKEND_HANDLER__ = server;
    console.log('[Hostinger] Backend embedded in web process (no separate port).');
  } else {
    // Call listen() IMMEDIATELY so Hostinger Node.js supervisor detects listen() in < 100ms
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`[Hostinger] Backend HTTP server listening immediately on port ${port}`);
    });
  }

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');

    // Ảnh banner được gửi dạng data URL nên cần nới giới hạn mặc định 100kb của body JSON
    app.useBodyParser('json', { limit: '8mb' });
    app.useBodyParser('urlencoded', { limit: '8mb', extended: true });

    // Sau reverse proxy (Hostinger/Nginx/Cloudflare) cần tin X-Forwarded-For để lấy đúng IP khách.
    app.set('trust proxy', 1);
    // Khi chạy thật, chỉ cho phép các tên miền trong CORS_ORIGINS (hoặc PUBLIC_WEB_URL); môi trường dev thì mở.
    const allowed = (process.env.CORS_ORIGINS ?? process.env.PUBLIC_WEB_URL ?? '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    app.enableCors({
      origin: process.env.NODE_ENV === 'production' && allowed.length
        ? (origin, cb) => cb(null, !origin || allowed.includes(origin))
        : true,
      credentials: true,
    });
    server.disable('x-powered-by');
    server.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
    app.useGlobalFilters(new ErrorAlertFilter());

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    await app.init();
    ready = true;
    console.log('[NestJS] Application initialized and ready.');
  } catch (err) {
    console.error('[NestJS] Error during bootstrap initialization:', err);
  }
}

void bootstrap();
