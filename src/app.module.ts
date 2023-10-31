import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { OrderModule } from './order/order.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [RedisModule, OrderModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
