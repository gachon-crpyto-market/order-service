import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TransactionDto {
  @IsNotEmpty()
  @IsString()
  buyerId: string;

  @IsNotEmpty()
  @IsString()
  sellerId: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  timestamp: string;
}
