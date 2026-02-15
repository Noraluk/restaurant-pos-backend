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
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { parsePagination } from '@/shared/pagination';
import { MenuService } from './menu.service';

const { diskStorage } = require('multer');

function ensureDir(dirPath: string) {
  if (existsSync(dirPath)) return;
  mkdirSync(dirPath, { recursive: true });
}

function parsePrice(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    try {
      const pagination = parsePagination({ page, limit });
      return this.menuService.list(req, pagination, { categoryId });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.menuService.getById(id, req);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = join(process.cwd(), 'uploads', 'menu');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const ext = extname(file.originalname || '') || '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  async create(
    @Body('name') name: string,
    @Body('price') price: string,
    @Body('categoryId') categoryId?: string,
    @UploadedFile() file?: any,
    @Req() req?: any,
  ) {
    if (!name) throw new BadRequestException('name is required');
    const parsedPrice = parsePrice(price);
    if (parsedPrice === null) throw new BadRequestException('price is invalid');

    if (file && typeof file.mimetype === 'string' && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('image must be an image');
    }

    const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : undefined;
    const imageKey = file ? `menu/${file.filename}` : null;
    return this.menuService.create(
      {
        name,
        price: parsedPrice,
        imageKey,
        categoryId: normalizedCategoryId ? normalizedCategoryId : null,
      },
      req,
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = join(process.cwd(), 'uploads', 'menu');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const ext = extname(file.originalname || '') || '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('price') price?: string,
    @Body('categoryId') categoryId?: string,
    @UploadedFile() file?: any,
    @Req() req?: any,
  ) {
    const updateInput: {
      name?: string;
      price?: number;
      imageKey?: string | null;
      categoryId?: string | null;
    } = {};

    if (name !== undefined) {
      if (!name) throw new BadRequestException('name is invalid');
      updateInput.name = name;
    }

    if (price !== undefined) {
      const parsedPrice = parsePrice(price);
      if (parsedPrice === null) throw new BadRequestException('price is invalid');
      updateInput.price = parsedPrice;
    }

    if (file) {
      if (typeof file.mimetype === 'string' && !file.mimetype.startsWith('image/')) {
        throw new BadRequestException('image must be an image');
      }
      updateInput.imageKey = `menu/${file.filename}`;
    }

    if (categoryId !== undefined) {
      const normalizedCategoryId = categoryId.trim();
      updateInput.categoryId = normalizedCategoryId ? normalizedCategoryId : null;
    }

    return this.menuService.update(id, updateInput, req);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.menuService.delete(id);
    return { ok: true };
  }
}
