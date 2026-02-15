import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { HealthModule } from '@/features/health/health.module';
import { LineModule } from '@/features/line/line.module';
import { MenuModule } from '@/features/menu/menu.module';
import { OrdersModule } from '@/features/orders/orders.module';
import { UsersModule } from '@/features/users/users.module';
import { InternalBasicAuthMiddleware } from '@/middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    HealthModule,
    LineModule,
    MenuModule,
    OrdersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InternalBasicAuthMiddleware).forRoutes(
      { path: '_internal', method: RequestMethod.ALL },
      { path: '_internal/(.*)', method: RequestMethod.ALL },
    );
  }
}
