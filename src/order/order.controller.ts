import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('bidList')
  async getBidList(): Promise<any> {
    return await this.orderService.getBidList();
  }
}
