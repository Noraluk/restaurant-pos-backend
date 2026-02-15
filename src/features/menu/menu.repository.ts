import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu.entity';

@Injectable()
export class MenuRepository {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
  ) {}

  findAll() {
    return this.menuRepo.find({ order: { createdAt: 'DESC' } });
  }

  findPage(params: { skip: number; take: number; categoryId?: string }) {
    return this.menuRepo.findAndCount({
      where: params.categoryId ? { categoryId: params.categoryId } : {},
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
  }

  findById(id: string) {
    return this.menuRepo.findOne({ where: { id } });
  }

  save(entity: MenuItem) {
    return this.menuRepo.save(entity);
  }

  create(data: Partial<MenuItem>) {
    return this.menuRepo.create(data);
  }

  remove(entity: MenuItem) {
    return this.menuRepo.remove(entity);
  }
}
