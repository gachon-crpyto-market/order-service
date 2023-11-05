import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { ORDER_TYPE } from '../../types';
import { OrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  @Inject('BID_REDIS_CLIENT') private readonly bidRedis: RedisClientType;
  @Inject('ASK_REDIS_CLIENT') private readonly askRedis: RedisClientType;
  private readonly logger: Logger = new Logger(OrderService.name);

  async setBidOrder(orderDto: OrderDto): Promise<any> {
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

    // 오름차순 정렬
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

    // 최종적으로 orderList를 사용해서 매수 주문을 처리
    for (const orderListElement of orderList) {
      const priceKey: string = orderListElement.price.toString();
      if (remainQuantity > 0) {
        if (orderListElement.quantity <= remainQuantity) {
          // 매수 주문 수량이 남은 수량보다 작을 경우
          // 매수 주문 수량만큼 주문을 처리하고
          // 남은 수량을 다시 매수 주문에 등록

          // 체결된 결과
          const concludedOrder: any = await this.askRedis.json.GET(priceKey);
          this.logger.debug('전부 체결된 주문: ', concludedOrder[0]);

          // 체결된 주문 매도 redis에서 제거
          //forget 사용 고려
          await this.askRedis.json.ARRTRIM(priceKey, '$', 1, -1);
          remainQuantity -= orderListElement.quantity;

          // 배열이 비었으면 키를 삭제
          if ((await this.askRedis.json.ARRLEN(priceKey)) === 0) {
            this.logger.debug(priceKey + '원의 주문이 비어있어 키를 삭제');
            await this.askRedis.json.DEL(priceKey);
          }
        } else {
          await this.askRedis.json.SET(
            priceKey,
            '$[0].quantity',
            orderListElement.quantity - remainQuantity,
          );

          const concludedOrder: any = await this.askRedis.json.GET(priceKey);
          // 실제 체결된 결과를 보내주기 위해 quantity값 갱신
          concludedOrder[0].quantity = remainQuantity;
          this.logger.debug('일부 체결된 주문', concludedOrder[0]);

          remainQuantity = 0;
          break;
        }
      }
    }
    // 체결 과정 이후의 매도 주문 리스트
    this.logger.debug('체결 과정 이후 매도 주문 리스트');
    this.logger.debug(await this.getAskList());

    if (remainQuantity === 0) {
      return;
    }
    // 남은 quantity가 있으면 매수 주문을 등록
    const bidInfo = {
      userId,
      timestamp,
      quantity: remainQuantity,
    };

    if ((await this.isExist(ORDER_TYPE.BID, price)) === false) {
      await this.bidRedis.json.SET(price.toString(), '$', []);
    }

    return await this.bidRedis.json.ARRAPPEND(price.toString(), '$', bidInfo);
  }

  async setAskOrder(orderDto: OrderDto): Promise<any> {
    const { userId, timestamp, price, quantity } = orderDto;
    let remainQuantity: number = quantity;

    // 모든 키를 받아와서 매도 주문의 가격보다 낮은 가격의 키를 모두 제거
    const keys = await this.getAllKeys(ORDER_TYPE.BID);

    for (let i = 0; i < keys.length; i++) {
      if (Number(keys[i]) < price) {
        keys.splice(i, 1);
        i--;
      }
    }

    // 내림차순 정렬
    keys.sort((a, b) => Number(b) - Number(a));

    const orderList = [];

    for (const key of keys) {
      const bidList: any = await this.bidRedis.json.GET(key);
      bidList.forEach((bidOrder) => {
        bidOrder.price = Number(key);
        orderList.push(bidOrder);
      });
    }

    // 최종적으로 orderList를 사용해서 매도 주문을 처리
    for (const orderListElement of orderList) {
      const priceKey: string = orderListElement.price.toString();
      if (remainQuantity > 0) {
        if (orderListElement.quantity <= remainQuantity) {
          // 매도 주문 수량이 남은 수량보다 작을 경우
          // 매도 주문 수량만큼 주문을 처리하고
          // 남은 수량을 다시 매도 주문에 등록

          // 체결된 결과
          const concludedOrder: any = await this.bidRedis.json.GET(priceKey);
          this.logger.debug('전부 체결된 주문: ', concludedOrder[0]);

          // 체결된 주문 매수 redis에서 제거
          //forget 사용 고려
          await this.bidRedis.json.ARRTRIM(priceKey, '$', 1, -1);
          remainQuantity -= orderListElement.quantity;

          // 배열이 비었으면 키를 삭제
          if ((await this.bidRedis.json.ARRLEN(priceKey)) === 0) {
            this.logger.debug(priceKey + '원의 주문이 비어있어 키를 삭제');
            await this.bidRedis.json.DEL(priceKey);
          }
        } else {
          await this.bidRedis.json.SET(
            priceKey,
            '$[0].quantity',
            orderListElement.quantity - remainQuantity,
          );

          const concludedOrder: any = await this.bidRedis.json.GET(priceKey);
          // 실제 체결된 결과를 보내주기 위해 quantity값 갱신
          concludedOrder[0].quantity = remainQuantity;
          this.logger.debug('일부 체결된 주문: ', concludedOrder[0]);

          remainQuantity = 0;
          break;
        }
      }
    }
    // 체결 과정 이후의 매도 주문 리스트
    this.logger.debug('체결 과정 이후 매수 주문 리스트');
    this.logger.debug(await this.getBidList());

    if (remainQuantity === 0) {
      return;
    }
    // 남은 quantity가 있으면 매수 주문을 등록
    const askInfo = {
      userId,
      timestamp,
      quantity: remainQuantity,
    };

    if ((await this.isExist(ORDER_TYPE.ASK, price)) === false) {
      await this.askRedis.json.SET(price.toString(), '$', []);
    }

    return await this.askRedis.json.ARRAPPEND(price.toString(), '$', askInfo);
  }

  async getBidList(): Promise<any> {
    const keys = await this.getAllKeys(ORDER_TYPE.BID);
    return await Promise.all(
      keys.map(async (price) => {
        const order = await this.bidRedis.json.get(price);
        return { price, order };
      }),
    );
  }

  async getAskList(): Promise<any> {
    const keys = await this.getAllKeys(ORDER_TYPE.ASK);
    return await Promise.all(
      keys.map(async (price) => {
        const order = await this.askRedis.json.get(price);
        return { price, order };
      }),
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
