import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineAuthMiddleware } from '@/middleware';
import { LineModule } from '@/features/line/line.module';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu.entity';
import { MenuCategoryController, MenuCategoryInternalController } from './menu-category.controller';
import { MenuCategoryRepository } from './menu-category.repository';
import { MenuCategoryService } from './menu-category.service';
import { MenuController } from './menu.controller';
import { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';

@Module({
  imports: [LineModule, TypeOrmModule.forFeature([MenuCategory, MenuItem])],
  controllers: [MenuController, MenuCategoryController, MenuCategoryInternalController],
  providers: [
    MenuRepository,
    MenuService,
    MenuCategoryRepository,
    MenuCategoryService,
    LineAuthMiddleware,
  ],
})
export class MenuModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LineAuthMiddleware).forRoutes(
      { path: 'menus', method: RequestMethod.GET },
      { path: 'menus/:id', method: RequestMethod.GET },
      { path: 'menu-categories', method: RequestMethod.GET },
    );
  }
}
