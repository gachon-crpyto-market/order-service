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

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any): string {
    this.server.emit('message', body);
    return 'Hello world!';
  }

  afterInit() {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Connected : ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
  }
}
