import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { OrderDto } from './dto/order.dto';

@WebSocketGateway(80, {
  namespace: 'events',
  cors: { origin: '*' },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;
  private readonly logger: Logger = new Logger(EventsGateway.name);
  constructor(private readonly orderService: OrderService) {}

  @SubscribeMessage('bid')
  async handleBid(@MessageBody() orderDto: OrderDto): Promise<string> {
    this.logger.log('-----매수 요청-----', orderDto);
    try {
      const lastPrice: number | null = await this.orderService.setBidOrder(orderDto);
      this.server.emit('lastPrice', lastPrice);
      this.server.emit('bidList', await this.orderService.getBidList());
      this.server.emit('askList', await this.orderService.getAskList());
      return '매수 요청 성공';
    } catch (error) {
      this.logger.error(error);
      return '매수 요청 실패';
    }
  }

  @SubscribeMessage('ask')
  async handleAsk(@MessageBody() orderDto: OrderDto): Promise<string> {
    this.logger.log('-----매도 요청-----', orderDto);
    try {
      const lastPrice: number | null = await this.orderService.setAskOrder(orderDto);
      this.server.emit('lastPrice', lastPrice);
      this.server.emit('bidList', await this.orderService.getBidList());
      this.server.emit('askList', await this.orderService.getAskList());
      return '매도 요청 성공';
    } catch (error) {
      this.logger.error(error);
      return '매도 요청 실패';
    }
  }

  afterInit() {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Connected : ${client.id}`);
    client.emit('bidList', await this.orderService.getBidList());
    client.emit('askList', await this.orderService.getAskList());
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
  }
}
