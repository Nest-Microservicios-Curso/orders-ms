import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateOrderDto,
  OrdersPaginationDto,
  UpdateOrderStatusDto,
} from './dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PRODUCTS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { resourceUsage } from 'process';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(PRODUCTS_SERVICE) private readonly productsMSClient: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.verbose('OrdersDB connected!');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // ? products exists?:
      const productsIds: number[] = createOrderDto.items.map(
        (item) => item.idProduct,
      );

      const productsValidated: any[] = await firstValueFrom(
        this.productsMSClient.send({ cmd: 'validateProduct' }, productsIds),
      );

      // ? order header(master):
      const totalAmount = createOrderDto.items.reduce(
        (acumulatedValue, orderItem) => {
          const price = productsValidated.find(
            (product) => product.id === orderItem.idProduct,
          ).price;

          return acumulatedValue + orderItem.quantity * price;
        },
        0,
      );

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //* insert into db:
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totoalItems: totalItems,
          orderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                productId: orderItem.idProduct,
                quantity: orderItem.quantity,
                price: productsValidated.find(
                  (product) => product.id === orderItem.idProduct,
                ).price,
              })),
            },
          },
        },
        include: {
          orderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      return {
        ...order,
        orderItem: order.orderItem.map((item) => ({
          ...item,
          name: productsValidated.find(
            (product) => product.id === item.productId,
          ).name,
        })),
      };
    } catch (error) {
      throw new RpcException(error);
    }
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
    const result = await this.order.findFirst({
      where: { id },
      include: {
        orderItem: {
          select: {
            productId: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    if (!result)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order(#${id}) not found`,
      });

    const productIds = result.orderItem.map((item) => item.productId);

    const products: any[] = await firstValueFrom(
      this.productsMSClient.send({ cmd: 'validateProduct' }, productIds),
    );

    return {
      ...result,
      orderItem: result.orderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };
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
