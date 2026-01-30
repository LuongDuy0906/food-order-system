import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { EventsGateway } from 'src/events/events.gateway';

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

    const tableId = await this.prisma.table.findUnique({
      select: { id: true },
      where: {
        number: tableNumber,
      },
    });

    if(!tableId){
      throw new BadRequestException('Bàn không tồn tại');
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

    const savedOrder = await this.prisma.order.create({
      data: {
        tableId: tableId.id,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: { product: true },
        }
      },
    });

    console.log('🔥 Đang bắn socket tin hiệu cho Waiter...');
    this.eventsGateway.notifyWaiterNewOrder(savedOrder);

    return savedOrder
  }

  async findAll() {
    return await this.prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
        table: true,
      },
    });
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

    this.eventsGateway.notifyCustomerOrderStatus(id, newStatus);

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
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  [OrderStatus.PENDING]: OrderStatus.COMFIRMED,
  [OrderStatus.COMFIRMED]: OrderStatus.IN_PROGRESS,
  [OrderStatus.IN_PROGRESS]: OrderStatus.COMPLETED,
  [OrderStatus.COMPLETED]: null,
};
