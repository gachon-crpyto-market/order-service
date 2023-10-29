import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { ORDER_TYPE } from '../../types';

@Injectable()
export class OrderService {
  @Inject('BID_REDIS_CLIENT') private readonly bidRedis: RedisClientType;
  @Inject('ASK_REDIS_CLIENT') private readonly askRedis: RedisClientType;

  async setBidOrder(
    userId: string,
    timestamp: string,
    price: number,
    quantity: number,
  ): Promise<any> {
    const bidInfo = {
      userId,
      timestamp,
      quantity,
    };

    if ((await this.isExist(ORDER_TYPE.BID, price)) === false) {
      await this.bidRedis.json.SET(price.toString(), '$', []);
    }

    return await this.bidRedis.json.ARRAPPEND(price.toString(), '$', bidInfo);
  }

  async setAskOrder(
    userId: string,
    timestamp: string,
    price: number,
    quantity: number,
  ): Promise<any> {
    const askInfo = {
      userId,
      timestamp,
      quantity,
    };

    if ((await this.isExist(ORDER_TYPE.ASK, price)) === false) {
      await this.askRedis.json.SET(price.toString(), '$', []);
    }

    await this.askRedis.json.ARRAPPEND(price.toString(), '$', askInfo);
  }

  async getBidList(): Promise<any> {
    const keys = await this.getAllKeys(ORDER_TYPE.BID);
    return await Promise.all(
      keys.map(async (key) => await this.bidRedis.json.get(key)),
    );
  }

  async getAskList(): Promise<any> {
    const keys = await this.getAllKeys(ORDER_TYPE.ASK);
    return await Promise.all(
      keys.map(async (key) => await this.askRedis.json.get(key)),
    );
  }

  async isExist(orderType: ORDER_TYPE, price: number) {
    if (orderType === ORDER_TYPE.BID) {
      return !!(await this.bidRedis.json.get(price.toString()));
    } else if (orderType === ORDER_TYPE.ASK) {
      return !!(await this.askRedis.json.get(price.toString()));
    }
  }

  async getAllKeys(orderType: ORDER_TYPE): Promise<any> {
    if (orderType === ORDER_TYPE.BID) {
      return this.bidRedis.keys('*');
    } else if (orderType === ORDER_TYPE.ASK) {
      return this.askRedis.keys('*');
    }
  }
}
