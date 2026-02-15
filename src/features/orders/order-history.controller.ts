import { BadRequestException, Controller, Get, Param, Query, Req } from '@nestjs/common';
import { parsePagination } from '@/shared/pagination';
import { OrdersService } from './orders.service';

@Controller('order-history')
export class OrderHistoryController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerName') customerName?: string,
    @Req() req?: any,
  ) {
    try {
      const pagination = parsePagination({ page, limit });
      return this.ordersService.listHistory(pagination, req?.user?.lineUserId, { customerName });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req?: any) {
    return this.ordersService.getHistoryById(id, req?.user?.lineUserId);
  }
}
