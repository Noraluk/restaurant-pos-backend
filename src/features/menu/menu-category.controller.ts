import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { parsePagination } from '@/shared/pagination';
import { MenuCategoryService } from './menu-category.service';

@Controller('_internal/menu-categories')
export class MenuCategoryController {
  constructor(private readonly menuCategoryService: MenuCategoryService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    try {
      const pagination = parsePagination({ page, limit });
      return this.menuCategoryService.list(pagination, { q });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.menuCategoryService.getById(id);
  }

  @Post()
  create(@Body('name') name: string) {
    return this.menuCategoryService.create({ name });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body('name') name?: string) {
    return this.menuCategoryService.update(id, { name });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.menuCategoryService.delete(id);
    return { ok: true };
  }
}
