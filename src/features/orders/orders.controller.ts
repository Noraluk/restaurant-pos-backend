import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { parsePagination } from '@/shared/pagination';
import { OrdersService } from './orders.service';

function parseIntStrict(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('customerName') customerName?: string,
    @Req() req?: any,
  ) {
    try {
      const pagination = parsePagination({ page, limit });
      return this.ordersService.list(pagination, req?.user?.lineUserId, { status, customerName });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req?: any) {
    return this.ordersService.getById(id, req?.user?.lineUserId);
  }

  @Post()
  create(
    @Body('customerName') customerName?: string,
    @Body('note') note?: string,
    @Body('items') items?: Array<{ menuItemId: string; quantity: unknown; note?: string }>,
    @Req() req?: any,
  ) {
    const normalizedItems = Array.isArray(items)
      ? items.map((it) => ({
          menuItemId: it?.menuItemId,
          quantity: parseIntStrict(it?.quantity),
          note: it?.note,
        }))
      : [];

    return this.ordersService.create(req?.user?.lineUserId, {
      customerName,
      note,
      items: normalizedItems as Array<{ menuItemId: string; quantity: number; note?: string }>,
    });
  }
}
