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

  async processOrder(createOrderDto: CreateOrderDto) {
    const { tableNumber, items, tempId } = createOrderDto;

    try {
        const productsId = items.map(item => item.productId);

        const products = await this.prisma.product.findMany({
            where: { id: { in: productsId } },
        });

        const table = await this.prisma.table.findUnique({
            select: { id: true, status: true },
            where: { number: tableNumber },
        });

        if (!table) { // Giả sử false là Bàn đang bận/Không khả dụng
            throw new BadRequestException('Bàn không khả dụng hoặc đang có khách');
        }

        if (products.length !== productsId.length) {
            throw new BadRequestException('Có sản phẩm không tồn tại hoặc đã bị xóa');
        }

        let totalAmount = 0;
        const orderItemsData = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new NotFoundException(`Sản phẩm ID ${item.productId} không tồn tại.`);
            
            if (!product.isEnable) throw new BadRequestException(`Món ${product.name} đang tạm ngưng phục vụ.`);

            totalAmount += product.price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                note: item.note
            };
        });

        const savedOrder = await this.prisma.order.create({
          data: {
            tableId: table.id,
            totalAmount,
            items: { create: orderItemsData },
          },
          include: {
            items: { include: { product: true } },
            table: true
          },
        });

        if (!this.eventsGateway) {
            console.error('❌ LỖI LỚN: eventsGateway bị null/undefined!');
            return;
        }

        console.log(`✅ Worker: Đã tạo xong đơn #${savedOrder.id} cho bàn ${tableNumber}`);

        this.eventsGateway.notifyOrderCreated(tempId, {
            id: savedOrder.id,
            accessKey: savedOrder.accessKey,
            message: 'Đặt món thành công!'
        });

        this.eventsGateway.notifyWaiterNewOrder(savedOrder);


    } catch (error) {
        console.error(`❌ Worker Lỗi: ${error.message}`);
        this.eventsGateway.server.to(`waiting_room_${tempId}`).emit('order_created_fail', {
            message: error.message || 'Có lỗi xảy ra khi xử lý đơn hàng'
        });
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

  async findAllWithTable(){
    return await this.prisma.order.findMany({
      select: {
        id: true,
        status: true,
        table: {
          select: {
            id: true,
            number: true
          }
        },
        items: {
          select: {
            quantity: true,
            note: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  }

  async findOne(id: number) {
    return await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            number: true,
          }
        }
      }
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
        note: item.note
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
      select:{
        id: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        table: {
          select: {
            number: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                name: true,
              }
            },
            note: true
          }
        }
      }
    });

    if(newStatus === OrderStatus.COMFIRMED){
      this.eventsGateway.notifyChefNewConfirmedOrder(updateStatusOrder);
    }

    this.eventsGateway.notifyCustomerOrderStatus(updateStatusOrder.id, newStatus);

    return {
      status: updateStatusOrder.status,
      updated_at: updateStatusOrder.updatedAt
    }
  }

  async remove(id: number) {
    return await this.prisma.order.delete({
      where: { id },
    });
  }

  async getTotalOrders(startDate: string, endDate: string, type: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const result = await this.prisma.order.aggregate({
      _count:{
        id: true
      },
      _sum: {
        totalAmount: true,
      },
      _avg: {
        totalAmount: true
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'PAID'
      }
    });

    const detail = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "PAID",
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

    const topItemsGrouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: 'PAID'
        }
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const productIds = topItemsGrouped.map(item => item.productId);
    
    const productsInfo = await this.prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        price: true,
      }
    });

    const topSellingItems = topItemsGrouped.map(item => {
      const product = productsInfo.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Sản phẩm đã xóa', // Fallback nếu SP bị xóa
        quantity: item._sum.quantity || 0,
        totalRevenue: (item._sum.quantity || 0) * (product?.price || 0) 
      };
    });

    return {
      revenue: {
        totalOrder: result._count.id || 0,
        totalAmount: result._sum.totalAmount || 0,
        avgAmount: result._avg.totalAmount || 0
      },
      data: chartData,
      topSelling: topSellingItems
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
