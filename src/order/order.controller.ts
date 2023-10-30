import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto } from './dto/order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @Post('bid')
  // async bid(@Body() orderDto: OrderDto): Promise<number | number[]> {
  //   return await this.orderService.setBidOrder(orderDto);
  // }

  @Post('bid')
  async bid(@Body() orderDto: OrderDto): Promise<number | number[]> {
    orderDto.timestamp = new Date().toISOString();
    return await this.orderService.newSetBidOrder(orderDto);
  }

  @Post('ask')
  async ask(@Body() orderDto: OrderDto): Promise<number | number[]> {
    orderDto.timestamp = new Date().toISOString();
    return await this.orderService.setAskOrder(orderDto);
  }

  @Get('bidList')
  async getBidList(): Promise<any> {
    return await this.orderService.getBidList();
  }

  @Get('askList')
  async getAskList(): Promise<any> {
    return await this.orderService.getAskList();
  }
}
