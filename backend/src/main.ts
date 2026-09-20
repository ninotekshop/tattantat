import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({
    // Local web development must work out of the box, but a deployed API is
    // never opened to arbitrary browser origins: production requires explicit
    // CORS_ORIGINS configuration.
    origin: configuredOrigins.length ? configuredOrigins : process.env.NODE_ENV === 'production' ? false : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
