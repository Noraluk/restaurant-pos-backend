import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineAuthMiddleware } from '@/middleware';
import { LineModule } from '@/features/line/line.module';
import { MenuItem } from '@/features/menu/entities/menu.entity';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { OrderHistoryItem } from './entities/order-history-item.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderHistoryController } from './order-history.controller';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    LineModule,
    TypeOrmModule.forFeature([Order, OrderItem, OrderHistory, OrderHistoryItem, MenuItem]),
  ],
  controllers: [OrdersController, OrderHistoryController],
  providers: [OrdersRepository, OrdersService, LineAuthMiddleware],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LineAuthMiddleware).forRoutes(OrdersController, OrderHistoryController);
  }
}
