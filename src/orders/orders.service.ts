import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import { stat } from 'fs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.verbose('OrdersDB connected!');
  }

  async create(createOrderDto: CreateOrderDto) {
    return await this.order.create({ data: createOrderDto });
  }

  async findAll() {
    return await this.order.findMany();
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

  setStatus(id: string) {
    return `This action set status to order #${id}`;
  }
}
