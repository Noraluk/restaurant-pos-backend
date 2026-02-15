import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from './entities/menu-category.entity';

@Injectable()
export class MenuCategoryRepository {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepo: Repository<MenuCategory>,
  ) {}

  findPage(params: { skip: number; take: number; q?: string }) {
    const qb = this.categoryRepo
      .createQueryBuilder('c')
      .orderBy('c.name', 'ASC')
      .skip(params.skip)
      .take(params.take);

    if (params.q?.trim()) {
      qb.where('c.name ILIKE :q', { q: `%${params.q.trim()}%` });
    }

    return qb.getManyAndCount();
  }

  findById(id: string) {
    return this.categoryRepo.findOne({ where: { id } });
  }

  findByName(name: string) {
    return this.categoryRepo.findOne({ where: { name } });
  }

  create(data: Partial<MenuCategory>) {
    return this.categoryRepo.create(data);
  }

  save(entity: MenuCategory) {
    return this.categoryRepo.save(entity);
  }

  remove(entity: MenuCategory) {
    return this.categoryRepo.remove(entity);
  }
}
