import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  const port = process.env.PORT ? Number(process.env.PORT) : 8081;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
