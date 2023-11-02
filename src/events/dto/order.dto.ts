import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class OrderDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  timestamp: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
