import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  providers: [EventsGateway],
})
export class EventsModule {}
