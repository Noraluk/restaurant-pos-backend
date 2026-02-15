import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app/app.module';

function parseCorsOrigins(value: string | undefined): true | string[] {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '*') return true;
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  const port = process.env.PORT ? Number(process.env.PORT) : 8081;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
