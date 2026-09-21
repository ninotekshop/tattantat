import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

const DEFAULT_SUPABASE_URL = 'https://brabreqaarmuovýmfnkl.supabase.co';
const DEFAULT_DATABASE_URL =
  'postgresql://postgres.brabreqaarmuovýmfnkl:Zf3Vqufu5lHZycg0@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

// Load environment variables synchronously
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = DEFAULT_SUPABASE_URL;
if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')
) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;
  const server = express();
  const httpServer = http.createServer(server);

  // Call listen() IMMEDIATELY so Hostinger Node.js supervisor detects listen() in < 100ms
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Hostinger] Backend HTTP server listening immediately on port ${port}`);
  });

  try {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    await app.init();
    console.log('[NestJS] Application initialized and ready.');
  } catch (err) {
    console.error('[NestJS] Error during bootstrap initialization:', err);
  }
}

void bootstrap();
