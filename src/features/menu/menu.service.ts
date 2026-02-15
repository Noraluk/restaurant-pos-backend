import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { buildPaginatedResult, Paginated, PaginationParams } from '@/shared/pagination';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu.entity';
import { MenuRepository } from './menu.repository';

type MenuDto = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
};

@Injectable()
export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly configService: ConfigService,
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepo: Repository<MenuCategory>,
  ) {}

  async list(
    req: any,
    params: PaginationParams,
    filters: { categoryId?: string },
  ): Promise<Paginated<MenuDto>> {
    const [rows, total] = await this.menuRepository.findPage({
      skip: params.skip,
      take: params.take,
      categoryId: filters.categoryId,
    });

    return buildPaginatedResult(
      rows.map((item) => this.toDto(item, req)),
      { page: params.page, limit: params.limit, total },
    );
  }

  async getById(id: string, req?: any): Promise<MenuDto> {
    const item = await this.menuRepository.findById(id);
    if (!item) throw new NotFoundException('menu not found');
    return this.toDto(item, req);
  }

  async create(
    input: { name: string; price: number; imageKey?: string | null; categoryId?: string | null },
    req?: any,
  ): Promise<MenuDto> {
    let categoryId = input.categoryId ?? null;
    if (typeof categoryId === 'string') {
      categoryId = categoryId.trim() ? categoryId.trim() : null;
    }

    if (categoryId) {
      const exists = await this.menuCategoryRepo.findOne({ where: { id: categoryId } });
      if (!exists) throw new NotFoundException('menu category not found');
    }

    const entity = this.menuRepository.create({
      name: input.name,
      price: input.price.toFixed(2),
      imageKey: input.imageKey ?? null,
      categoryId,
    });
    const saved = await this.menuRepository.save(entity);
    return this.toDto(saved, req);
  }

  async update(
    id: string,
    input: { name?: string; price?: number; imageKey?: string | null; categoryId?: string | null },
    req?: any,
  ): Promise<MenuDto> {
    const item = await this.menuRepository.findById(id);
    if (!item) throw new NotFoundException('menu not found');

    if (typeof input.name === 'string') item.name = input.name;
    if (typeof input.price === 'number') item.price = input.price.toFixed(2);

    if (input.imageKey !== undefined) {
      const oldKey = item.imageKey;
      item.imageKey = input.imageKey;
      if (oldKey && oldKey !== input.imageKey) await this.safeDeleteImage(oldKey);
    }

    if (input.categoryId !== undefined) {
      let categoryId = input.categoryId;
      if (typeof categoryId === 'string') {
        categoryId = categoryId.trim() ? categoryId.trim() : null;
      }

      if (categoryId) {
        const exists = await this.menuCategoryRepo.findOne({ where: { id: categoryId } });
        if (!exists) throw new NotFoundException('menu category not found');
      }

      item.categoryId = categoryId ?? null;
    }

    const saved = await this.menuRepository.save(item);
    return this.toDto(saved, req);
  }

  async delete(id: string): Promise<void> {
    const item = await this.menuRepository.findById(id);
    if (!item) throw new NotFoundException('menu not found');

    await this.menuRepository.remove(item);
    if (item.imageKey) await this.safeDeleteImage(item.imageKey);
  }

  private toDto(item: MenuItem, req?: any): MenuDto {
    const baseUrl = this.getPublicBaseUrl(req);
    const imageUrl = item.imageKey ? `${baseUrl}/uploads/${item.imageKey}` : null;

    return {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      imageUrl,
      categoryId: item.categoryId ?? null,
    };
  }

  private getPublicBaseUrl(req?: any) {
    const configured = this.configService.get<string>('PUBLIC_BASE_URL');
    if (configured) return configured.replace(/\/$/, '');

    if (req?.protocol && typeof req.get === 'function') {
      const host = req.get('host');
      if (host) return `${req.protocol}://${host}`;
    }

    const port = this.configService.get<string>('PORT') ?? '8081';
    return `http://localhost:${port}`;
  }

  private async safeDeleteImage(imageKey: string) {
    const diskPath = join(process.cwd(), 'uploads', imageKey);
    try {
      await fs.unlink(diskPath);
    } catch {
      return;
    }
  }
}
