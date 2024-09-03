import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDto } from './dto';

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
    return await this.order.findFirst({ where: { id } });
  }

  setStatus(id: string) {
    return `This action set status to order #${id}`;
  }
}
