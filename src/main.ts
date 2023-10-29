import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성값은 제거하고 에러메시지 출력
      transform: true, // DTO에 정의된 타입으로 변환
      forbidNonWhitelisted: true, // DTO에 없는 속성값이 들어오면 에러메시지 출력
    }),
  );
  await app.listen(3000);
}

bootstrap();
