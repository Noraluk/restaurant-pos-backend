import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginatedResult, Paginated, PaginationParams } from '@/shared/pagination';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuCategoryRepository } from './menu-category.repository';

type MenuCategoryDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class MenuCategoryService {
  constructor(private readonly menuCategoryRepository: MenuCategoryRepository) {}

  async list(
    params: PaginationParams,
    filters: { q?: string },
  ): Promise<Paginated<MenuCategoryDto>> {
    const [rows, total] = await this.menuCategoryRepository.findPage({
      skip: params.skip,
      take: params.take,
      q: filters.q,
    });

    return buildPaginatedResult(
      rows.map((c) => this.toDto(c)),
      { page: params.page, limit: params.limit, total },
    );
  }

  async getById(id: string): Promise<MenuCategoryDto> {
    const category = await this.menuCategoryRepository.findById(id);
    if (!category) throw new NotFoundException('menu category not found');
    return this.toDto(category);
  }

  async create(input: { name: string }): Promise<MenuCategoryDto> {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('name is required');

    const existing = await this.menuCategoryRepository.findByName(name);
    if (existing) throw new BadRequestException('name already exists');

    const entity = this.menuCategoryRepository.create({ name });
    const saved = await this.menuCategoryRepository.save(entity);
    return this.toDto(saved);
  }

  async update(id: string, input: { name?: string }): Promise<MenuCategoryDto> {
    const category = await this.menuCategoryRepository.findById(id);
    if (!category) throw new NotFoundException('menu category not found');

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException('name is invalid');

      const existing = await this.menuCategoryRepository.findByName(name);
      if (existing && existing.id !== category.id) {
        throw new BadRequestException('name already exists');
      }

      category.name = name;
    }

    const saved = await this.menuCategoryRepository.save(category);
    return this.toDto(saved);
  }

  async delete(id: string): Promise<void> {
    const category = await this.menuCategoryRepository.findById(id);
    if (!category) throw new NotFoundException('menu category not found');
    await this.menuCategoryRepository.remove(category);
  }

  private toDto(category: MenuCategory): MenuCategoryDto {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
