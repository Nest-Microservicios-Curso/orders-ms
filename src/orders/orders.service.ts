import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateOrderDto,
  OrdersPaginationDto,
  UpdateOrderStatusDto,
} from './dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.verbose('OrdersDB connected!');
  }

  async create(createOrderDto: CreateOrderDto) {
    return createOrderDto;
  }

  async findAll(orderPaginationDto: OrdersPaginationDto) {
    const totalOrders = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const lastPage = Math.ceil(totalOrders / orderPaginationDto.limit);

    const { page, limit } = orderPaginationDto;

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      meta: {
        totalOrders,
        lastPage,
        page,
      },
    };
  }

  async findOne(id: string) {
    const result = await this.order.findFirst({ where: { id } });

    if (!result)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order(#${id}) not found`,
      });

    return result;
  }

  async setStatus(updateOrderStatusDto: UpdateOrderStatusDto) {
    const { id, status } = updateOrderStatusDto;
    const orderToUpdate = await this.findOne(id);
    if (orderToUpdate.status === status) return orderToUpdate;

    return this.order.update({
      where: { id },
      data: { status },
    });
  }
}
