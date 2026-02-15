import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  async findPage(params: {
    skip: number;
    take: number;
    lineUserId: string;
    status?: string;
    customerName?: string;
  }) {
    const qb = this.ordersRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .orderBy('o.createdAt', 'DESC')
      .skip(params.skip)
      .take(params.take);

    qb.andWhere('o.lineUserId = :lineUserId', { lineUserId: params.lineUserId });
    if (params.status) qb.andWhere('o.status = :status', { status: params.status });
    if (params.customerName) {
      qb.andWhere('o.customerName ILIKE :customerName', {
        customerName: `%${params.customerName}%`,
      });
    }

    return qb.getManyAndCount();
  }

  findById(id: string, lineUserId: string) {
    return this.ordersRepo.findOne({
      where: { id, lineUserId },
      relations: { items: true },
    });
  }

  findByIdAny(id: string) {
    return this.ordersRepo.findOne({
      where: { id },
      relations: { items: true },
    });
  }

  save(order: Order) {
    return this.ordersRepo.save(order);
  }
}
