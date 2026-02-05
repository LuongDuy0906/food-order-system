import { UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Role } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { RolesGuard } from "src/modules/auth/guards/roles/roles.guard";
import { OrdersService } from "src/modules/orders/orders.service";
import { PrismaService } from "src/prisma/prisma.service";

interface JoinOrderInterface {
    orderId: number;
    accessKey: string;
}

@WebSocketGateway({ cors: { origin: "*" } })
export class EventsGateway{

    @WebSocketServer()
    server: Server;

    constructor(
      private jwtService: JwtService,
      private configService: ConfigService,
      private readonly prisma: PrismaService,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;

            if (token) {
                const secret = this.configService.get<string>('jwt.secret');
                const payload = await this.jwtService.verifyAsync(token, { secret });
                
                client.data.user = payload; 
                console.log(`🔐 User ${payload.role} đã kết nối.`);
                
            } else {
                client.data.user = null;
                console.log(`🌍 Khách vãng lai (Guest) đã kết nối: ${client.id}`);
            }

        } catch (error) {
            console.log(`❌ Token không hợp lệ: ${error.message}`);
            client.disconnect();
        }
    }

    @UseGuards(RolesGuard)
    @Roles(Role.WAITER)
    @SubscribeMessage('join_waiter_room')
    handleJoinWaiterRoom(@ConnectedSocket() client: Socket) {
        client.join('waiter_room')
    }

    @SubscribeMessage('join_waiting_room')
    handleJoinWaitingRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
        let id = payload;

      if (typeof payload === 'string') {
          try {
              const parsed = JSON.parse(payload);
              if (parsed.tempId) {
                  id = parsed.tempId;
              }
          } catch (error) {
          }
      } 
      else if (typeof payload === 'object' && payload.tempId) {
          id = payload.tempId;
      }

      id = String(id).trim();

      const roomName = `waiting_room_${id}`;
      client.join(roomName);
      
      console.log(`Client join phòng chờ chính xác: [${roomName}]`);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.CHEF)
    @SubscribeMessage('join_chef_room')
    handleJoinChefRoom(@ConnectedSocket() client: Socket) {
        client.join('chef_room');
    }

    @SubscribeMessage('join_order_room')
    async handleJoinOrderRoom(
        @ConnectedSocket() client: Socket, 
        @MessageBody() rawPayload: JoinOrderInterface) 
    {
        let payload = rawPayload;

        if (typeof rawPayload === 'string') {
            try {
                payload = JSON.parse(rawPayload);
            } catch (error) {
                console.log('Lỗi định dạng JSON:', rawPayload);
                return; 
            }
        }

        console.log('Payload sau khi xử lý:', payload);

        if (!payload || !payload.orderId || !payload.accessKey) {
            console.log('hiếu orderId hoặc accessKey');
            return;
        }

        const order = await this.prisma.order.findUnique({
            where: { id: Number(payload.orderId) },
        });

        if (!order) {
            console.log(`Đơn hàng ${payload.orderId} không tồn tại`);
            return;
        }

        if(order.accessKey !== payload.accessKey) {
            console.log(`Mã truy cập không hợp lệ cho đơn hàng ${payload.orderId}`);
            return;
        }

        const roomName = `order_${payload.orderId}`;
        client.join(roomName);
        console.log(`Khách hàng đã vào theo dõi đơn ${payload.orderId} (Key hợp lệ)`);
    }

    @SubscribeMessage('customer_request_service')
    handleCustomerRequest(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: {tableNumber: string, content: string}
    ){
        let data = payload;
        if (typeof payload === 'string') {
            try { data = JSON.parse(payload); } catch(e) {}
        }

        console.log(`Bàn ${data.tableNumber} gọi: ${data.content}`);

        this.server.to('waiter_room').emit('waiter_notification', {
            type: 'SERVER_REQUEST',
            tableNumber: data.tableNumber,
            message: data.content,
            time: new Date()
        })
    }

    notifyWaiterNewOrder(order: any){
        this.server.to('waiter_room').emit('waiter_new_order', order);
    }

    notifyChefNewConfirmedOrder(order: any){
        this.server.to('chef_room').emit('chef_new_confirmed_order', order);
    }

    notifyCustomerOrderStatus(orderId: number, status: string) {
        this.server.to(`order_${orderId}`).emit('order_status_updated', { orderId, status });
    }

    notifyOrderCreated(tempId: string, result: any) {
        this.server.to(`waiting_room_${tempId}`).emit('order_created_success', result);
    }
}