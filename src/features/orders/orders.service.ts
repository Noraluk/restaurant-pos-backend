import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { buildPaginatedResult, Paginated, PaginationParams } from '@/shared/pagination';
import { MenuItem } from '@/features/menu/entities/menu.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { OrderHistoryItem } from './entities/order-history-item.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersRepository } from './orders.repository';

type CreateOrderInput = {
  customerName?: string;
  note?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    note?: string;
  }>;
};

type UpdateOrderStatusInput = {
  status: OrderStatus;
};

type OrderItemDto = {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  note: string | null;
};

type OrderDto = {
  id: string;
  status: OrderStatus;
  customerName: string | null;
  lineUserId: string | null;
  note: string | null;
  total: number;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
};

type OrderHistoryItemDto = {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
};

type OrderHistoryDto = {
  id: string;
  orderId: string;
  customerName: string | null;
  lineUserId: string | null;
  total: number;
  orderedAt: string;
  createdAt: string;
  items: OrderHistoryItemDto[];
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'PENDING' ||
    value === 'IN_PROGRESS' ||
    value === 'COMPLETED' ||
    value === 'CANCELLED'
  );
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
    @InjectRepository(OrderHistory)
    private readonly orderHistoryRepo: Repository<OrderHistory>,
    @InjectRepository(OrderHistoryItem)
    private readonly orderHistoryItemRepo: Repository<OrderHistoryItem>,
  ) {}

  async list(
    params: PaginationParams,
    lineUserId: string,
    filters: { status?: string; customerName?: string },
  ): Promise<Paginated<OrderDto>> {
    const [rows, total] = await this.ordersRepository.findPage({
      skip: params.skip,
      take: params.take,
      lineUserId,
      status: filters.status,
      customerName: filters.customerName,
    });

    return buildPaginatedResult(
      rows.map((o) => this.toDto(o)),
      { page: params.page, limit: params.limit, total },
    );
  }

  async getById(id: string, lineUserId: string): Promise<OrderDto> {
    const order = await this.ordersRepository.findById(id, lineUserId);
    if (!order) throw new NotFoundException('order not found');
    return this.toDto(order);
  }

  async create(lineUserId: string, input: CreateOrderInput): Promise<OrderDto> {
    if (!lineUserId?.trim()) throw new BadRequestException('lineUserId is required');

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('items is required');
    }

    const normalizedItems = input.items.map((it) => ({
      menuItemId: it.menuItemId,
      quantity: it.quantity,
      note: it.note ?? null,
    }));

    for (const it of normalizedItems) {
      if (!it.menuItemId) throw new BadRequestException('menuItemId is required');
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        throw new BadRequestException('quantity is invalid');
      }
    }

    const uniqueIds = Array.from(new Set(normalizedItems.map((it) => it.menuItemId)));
    const menus = await this.menuRepo.find({ where: { id: In(uniqueIds) } });
    const menuMap = new Map(menus.map((m) => [m.id, m]));

    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const it of normalizedItems) {
      const menu = menuMap.get(it.menuItemId);
      if (!menu) throw new BadRequestException('menuItemId is invalid');

      const unitPrice = Number(menu.price);
      if (!Number.isFinite(unitPrice)) throw new BadRequestException('menu price is invalid');

      const lineTotal = unitPrice * it.quantity;
      total += lineTotal;

      const orderItem = new OrderItem();
      orderItem.menuItemId = menu.id;
      orderItem.nameSnapshot = menu.name;
      orderItem.unitPriceSnapshot = unitPrice.toFixed(2);
      orderItem.quantity = it.quantity;
      orderItem.lineTotal = lineTotal.toFixed(2);
      orderItem.note = it.note;

      orderItems.push(orderItem);
    }

    const order = new Order();
    order.status = 'PENDING';
    order.customerName = input.customerName?.trim() ? input.customerName.trim() : null;
    order.lineUserId = lineUserId.trim();
    order.note = input.note?.trim() ? input.note.trim() : null;
    order.total = total.toFixed(2);
    order.items = orderItems;

    const saved = await this.ordersRepository.save(order);
    await this.archiveToHistoryIfNeeded(saved);
    return this.toDto(saved);
  }

  async updateStatus(
    id: string,
    lineUserId: string,
    input: UpdateOrderStatusInput,
  ): Promise<OrderDto> {
    if (!isOrderStatus(input.status)) throw new BadRequestException('status is invalid');

    const order = await this.ordersRepository.findById(id, lineUserId);
    if (!order) throw new NotFoundException('order not found');

    if (order.status === 'CANCELLED' && input.status !== 'CANCELLED') {
      throw new BadRequestException('order is cancelled');
    }
    if (order.status === 'COMPLETED' && input.status !== 'COMPLETED') {
      throw new BadRequestException('order is completed');
    }

    order.status = input.status;

    const saved = await this.ordersRepository.save(order);
    if (saved.status === 'COMPLETED') {
      await this.archiveToHistoryIfNeeded(saved);
    }
    return this.toDto(saved);
  }

  async listHistory(
    params: PaginationParams,
    lineUserId: string,
    filters: { customerName?: string },
  ): Promise<Paginated<OrderHistoryDto>> {
    const qb = this.orderHistoryRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.items', 'i')
      .orderBy('h.orderedAt', 'DESC')
      .addOrderBy('i.createdAt', 'ASC')
      .skip(params.skip)
      .take(params.take);

    qb.andWhere('h.lineUserId = :lineUserId', { lineUserId });
    if (filters.customerName?.trim()) {
      qb.andWhere('h.customerName ILIKE :customerName', { customerName: `%${filters.customerName.trim()}%` });
    }

    const [rows, total] = await qb.getManyAndCount();

    return buildPaginatedResult(
      rows.map((h) => this.toHistoryDto(h)),
      { page: params.page, limit: params.limit, total },
    );
  }

  async getHistoryById(id: string, lineUserId: string): Promise<OrderHistoryDto> {
    const history = await this.orderHistoryRepo.findOne({
      where: { id, lineUserId },
      relations: { items: true },
      order: { items: { createdAt: 'ASC' } },
    });
    if (!history) throw new NotFoundException('order history not found');
    return this.toHistoryDto(history);
  }

  private async archiveToHistoryIfNeeded(order: Order): Promise<void> {
    if (!order.items || order.items.length === 0) {
      const full = await this.ordersRepository.findByIdAny(order.id);
      if (!full) return;
      order = full;
    }

    await this.orderHistoryRepo.manager.transaction(async (manager) => {
      const existing = await manager.getRepository(OrderHistory).findOne({ where: { orderId: order.id } });
      if (existing) return;

      const history = new OrderHistory();
      history.orderId = order.id;
      history.customerName = order.customerName ?? null;
      history.lineUserId = order.lineUserId ?? null;
      history.total = order.total;
      history.orderedAt = order.createdAt;

      const items = (order.items ?? []).map((it) => {
        const hi = new OrderHistoryItem();
        hi.menuItemId = it.menuItemId ?? null;
        hi.nameSnapshot = it.nameSnapshot;
        hi.unitPriceSnapshot = it.unitPriceSnapshot;
        hi.quantity = it.quantity;
        hi.lineTotal = it.lineTotal;
        return hi;
      });

      history.items = items;
      await manager.getRepository(OrderHistory).save(history);
    });
  }

  private toDto(order: Order): OrderDto {
    return {
      id: order.id,
      status: order.status,
      customerName: order.customerName ?? null,
      lineUserId: order.lineUserId ?? null,
      note: order.note ?? null,
      total: Number(order.total),
      items: (order.items ?? []).map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId ?? null,
        name: it.nameSnapshot,
        unitPrice: Number(it.unitPriceSnapshot),
        quantity: it.quantity,
        lineTotal: Number(it.lineTotal),
        note: it.note ?? null,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toHistoryDto(history: OrderHistory): OrderHistoryDto {
    return {
      id: history.id,
      orderId: history.orderId,
      customerName: history.customerName ?? null,
      lineUserId: history.lineUserId ?? null,
      total: Number(history.total),
      orderedAt: history.orderedAt.toISOString(),
      createdAt: history.createdAt.toISOString(),
      items: (history.items ?? []).map((it) => ({
        id: it.id,
        menuItemId: it.menuItemId ?? null,
        name: it.nameSnapshot,
        unitPrice: Number(it.unitPriceSnapshot),
        quantity: it.quantity,
        lineTotal: Number(it.lineTotal),
        createdAt: it.createdAt.toISOString(),
      })),
    };
  }
}
