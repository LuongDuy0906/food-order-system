import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { EventsGateway } from 'src/events/events.gateway';
import { ppid } from 'process';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ){}

  async create(createOrderDto: CreateOrderDto) {
    const { tableNumber, items } = createOrderDto;
    const productsId = items.map(item => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productsId },
      },
    });

    const table = await this.prisma.table.findUnique({
      select: { id: true, status: true },
      where: {
        number: tableNumber,
      },
    });

    if(!table || table.status === false){
      throw new BadRequestException('Bàn không khả dụng để đặt món');
    }

    if (products.length !== productsId.length) {
      throw new BadRequestException('Có sản phẩm không tồn tại hoặc đã bị xóa');
    }


    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId);

      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại hoặc đã bị xóa.`);
      }

      if (!product.isEnable) {
         throw new BadRequestException(`Món ${product.name} hiện đang tạm hết.`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const [savedOrder] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          tableId: table.id,
          totalAmount,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { 
            include: { 
              product: true 
            } 
          },
        },
      }),
      this.prisma.table.update({
        where: { id: table.id },
        data: { status: false },
      }),
    ]);

    this.eventsGateway.notifyWaiterNewOrder(savedOrder);

    return {
      orderId: savedOrder.id,
      accessKey: savedOrder.accessKey,
      message: 'Đặt món thành công! Vui lòng lưu lại mã truy cập để theo dõi trạng thái đơn hàng.'
    }
  }

  async findAll() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [orderStats, activeTables, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({
        _count: {
          id: true,
        },
        _sum: {
          totalAmount: true
        },
        _avg: {
          totalAmount: true
        },
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),

      this.prisma.table.aggregate({
        _count: {
          id: true
        },
        where: {
          status: false
        }
      }),

      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          table: true,
          items: {
            select: {
              quantity: true
            }
          }
        }
      })
    ]);

    const formattedOrders = recentOrders.map(order => {

      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
          id: order.id,
          tableName: order.table?.number,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          itemCount: totalItems 
        };
    });

    return {
      totalOrders: orderStats._count.id || 0,
      totalRevenue: orderStats._sum.totalAmount || 0,
      averageOrderValue: orderStats._avg.totalAmount || 0,
      activeTables: activeTables._count.id,
      recentOrders: formattedOrders
    };
  }

  async findOne(id: number) {
    return await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        table: true,
      },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const {items} = updateOrderDto;

    const existOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if(!existOrder){
      throw new NotFoundException('Không tìm thấy order cần cập nhật');
    }

    if(existOrder.status !== 'PENDING'){
      throw new BadRequestException('Chỉ được phép cập nhật order với trạng thái PENDING');
    }
    
    const productIds = items?.map(item => item.productId) || [];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if(products.length !== productIds.length) {
      throw new BadRequestException('Có sản phẩm không tồn tại hoặc đã bị xóa');
    }

    let newTotalAmount = 0;
    const orderItemsData = items?.map(item => {
      const product = products.find(p => p.id === item.productId);

      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại hoặc đã bị xóa.`);
      }

      if (!product.isEnable) {
         throw new BadRequestException(`Món ${product.name} hiện đang tạm hết.`);
      }

      const itemTotal = product.price * item.quantity;
      newTotalAmount += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    return await this.prisma.order.update({
      where: { id },
      data: {
        totalAmount: newTotalAmount,
        items: {
          deleteMany: {},
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: { product: true }, 
        },
      },
    });
  }

  async updateStatus(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if(!order){
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;
    const newStatus = NEXT_STATUS[currentStatus];
    if(!newStatus){
      throw new BadRequestException('Không thể cập nhật trạng thái tiếp theo');
    }

    const updateStatusOrder = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });

    if(newStatus === OrderStatus.COMFIRMED){
      this.eventsGateway.notifyChefNewConfirmedOrder(updateStatusOrder);
    }

    this.eventsGateway.notifyCustomerOrderStatus(updateStatusOrder.id, newStatus);

    return updateStatusOrder;
  }

  async remove(id: number) {
    return await this.prisma.order.delete({
      where: { id },
    });
  }

  async getTotalOrdersPerDay(startDate: string, endDate: string, type: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const result = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED'
      }
    });

    const detail = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETED",
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const groupedData = detail.reduce((acc, order) => {
      let key: string = '';
      const isoString = order.createdAt.toISOString();

      if(type === 'hour'){
        key = `${isoString.substring(11, 13)}:00`;
      }
      else if(type === 'date'){
        key = isoString.split('T')[0];
      }
      else if(type === 'month'){
        key = isoString.substring(0, 7);
      }

      if (!acc[key]) acc[key] = 0;
      acc[key] += order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(groupedData).map(key => ({
      label: key,
      value: groupedData[key]
    }));

    return {
      revenue: result._sum.totalAmount || 0,
      data: chartData
    };
  }

  async checkout(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: id,
      },
    });
    
    if(!order){
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id },
        data: { status: OrderStatus.PAID },
      }),

      this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: true },
      }),
    ])

    return {
      message: "Thanh toán thành công"
    }
  }
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  [OrderStatus.PENDING]: OrderStatus.COMFIRMED,
  [OrderStatus.COMFIRMED]: OrderStatus.IN_PROGRESS,
  [OrderStatus.IN_PROGRESS]: OrderStatus.COMPLETED,
  [OrderStatus.COMPLETED]: null,
  [OrderStatus.PAID]: null,
};
