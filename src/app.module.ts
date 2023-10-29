import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [RedisModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
