import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { RedisModule } from '../redis/redis.module';
import { OrderService } from './order.service';

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [OrderService],
      controllers: [OrderController],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
