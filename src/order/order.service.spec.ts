import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { RedisModule } from '../redis/redis.module';
import { RedisClientType } from 'redis';
import { ORDER_TYPE } from '../../types';

describe('OrderService', () => {
  let service: OrderService;
  let bidRedisClient: RedisClientType;
  let askRedisClient: RedisClientType;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);
    bidRedisClient = module.get('BID_REDIS_CLIENT');
    askRedisClient = module.get('ASK_REDIS_CLIENT');
  });

  it('매수 redis 키 모두 가져오기', async () => {
    const keys = await service.getAllKeys(ORDER_TYPE.BID);
    expect(keys).toEqual(await bidRedisClient.keys('*'));
  });

  it('매수 주문 요청', async () => {
    const userId = 'test123';
    const timestamp = '45931350';
    const price = 102;
    const quantity = 10;
    const order = await service.setBidOrder(userId, timestamp, price, quantity);

    console.log(order);
  });

  afterEach(async () => {
    // Redis 클라이언트 해제
    await bidRedisClient.disconnect();
    await askRedisClient.disconnect();
  });
});
