import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { HealthModule } from '@/features/health/health.module';
import { LineModule } from '@/features/line/line.module';
import { UsersModule } from '@/features/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    HealthModule,
    LineModule,
  ],
})
export class AppModule {}
