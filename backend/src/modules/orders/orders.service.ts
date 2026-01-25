import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService){}

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

      if (!product.quantity) {
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

    return await this.prisma.order.create({
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

      if (!product.quantity) {
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

    return await this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async remove(id: number) {
    return await this.prisma.order.delete({
      where: { id },
    });
  }
} 

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
    [OrderStatus.PENDING]: OrderStatus.COMFIRMED,
    [OrderStatus.COMFIRMED]: OrderStatus.IN_PROGRESS,
    [OrderStatus.IN_PROGRESS]: OrderStatus.COMPLETED,
    [OrderStatus.COMPLETED]: null,
  };
