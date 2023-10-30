import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { ORDER_TYPE } from '../../types';
import { OrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  @Inject('BID_REDIS_CLIENT') private readonly bidRedis: RedisClientType;
  @Inject('ASK_REDIS_CLIENT') private readonly askRedis: RedisClientType;

  async setBidOrder(orderDto: OrderDto): Promise<number | number[]> {
    const { userId, timestamp, price, quantity } = orderDto;

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

  async newSetBidOrder(orderDto: OrderDto): Promise<any> {
    const { userId, timestamp, price, quantity } = orderDto;

    let remainQuantity: number = quantity;

    // 모든 키를 받아와서 매수 주문의 가격보다 높은 가격의 키를 모두 제거
    const keys = await this.getAllKeys(ORDER_TYPE.ASK);

    for (let i = 0; i < keys.length; i++) {
      if (Number(keys[i]) > price) {
        keys.splice(i, 1);
        i--;
      }
    }

    keys.sort((a, b) => Number(a) - Number(b));

    const orderList = [];

    for (const key of keys) {
      // orderList.push(await this.askRedis.json.get(key));
      const askList: any = await this.askRedis.json.GET(key);
      // askList.sort((a, b) => new Date(a.timestamp));
      askList.forEach((askOrder) => {
        askOrder.price = Number(key);
        orderList.push(askOrder);
      });
    }
    console.log(orderList);

    // 최종적으로 orderList를 사용해서 매수 주문을 처리
    for (const orderListElement of orderList) {
      const priceKey: string = orderListElement.price.toString();
      if (orderListElement.quantity <= remainQuantity) {
        // 매수 주문 수량이 남은 수량보다 작을 경우
        // 매수 주문 수량만큼 주문을 처리하고
        // 남은 수량을 다시 매수 주문
        await this.askRedis.json.ARRTRIM(priceKey, '$', 1, -1);
        remainQuantity -= orderListElement.quantity;

        // 배열이 비었으면 키를 삭제
        if ((await this.askRedis.json.ARRLEN(priceKey)) === 0) {
          await this.askRedis.json.DEL(priceKey);
        }
        // 체결된 결과 보내야함

      } else {
        await this.askRedis.json.SET(
          priceKey,
          '$[0].quantity',
          orderListElement.quantity - remainQuantity,
        );
        remainQuantity = 0;
        break;
      }
    }
    // 남은 quantity가 있으면 매수 주문을 등록
    const bidInfo = {
      userId,
      timestamp,
      remainQuantity,
    };

    if ((await this.isExist(ORDER_TYPE.BID, price)) === false) {
      await this.bidRedis.json.SET(price.toString(), '$', []);
    }

    return await this.bidRedis.json.ARRAPPEND(price.toString(), '$', bidInfo);
  }

  async setAskOrder(orderDto: OrderDto): Promise<number | number[]> {
    const { userId, timestamp, price, quantity } = orderDto;

    const askInfo = {
      userId,
      timestamp,
      quantity,
    };

    if ((await this.isExist(ORDER_TYPE.ASK, price)) === false) {
      await this.askRedis.json.SET(price.toString(), '$', []);
    }

    return await this.askRedis.json.ARRAPPEND(price.toString(), '$', askInfo);
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
