import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu.entity';
import { MenuController } from './menu.controller';
import { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem])],
  controllers: [MenuController],
  providers: [MenuRepository, MenuService],
})
export class MenuModule {}
