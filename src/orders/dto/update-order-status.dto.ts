import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Possible status values are: ${OrderStatusList}`,
  })
  status: OrderStatus;
}
