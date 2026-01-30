import { UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Role } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { RolesGuard } from "src/modules/auth/guards/roles/roles.guard";

@WebSocketGateway({ cors: { origin: "*" } })
export class EventsGateway{

    @WebSocketServer()
    server: Server;

    constructor(
      private jwtService: JwtService,
      private configService: ConfigService
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

    @UseGuards(RolesGuard)
    @Roles(Role.CHEF)
    @SubscribeMessage('join_chef_room')
    handleJoinChefRoom(@ConnectedSocket() client: Socket) {
        client.join('chef_room');
    }

    @SubscribeMessage('join_order_room')
    handleJoinOrderRoom(@ConnectedSocket() client: Socket, @MessageBody() orderId: number) {
        client.join(`order_${orderId}`);
    }

    notifyWaiterNewOrder(order: any){
        this.server.to('waiter_room').emit('waiter_new_order', order);
    }

    notifyChefNewConfirmedOrder(order: any){
        this.server.to('chef_room').emit('chef_new_confirmed_order', order);
    }

    notifyCustomerOrderStatus(orderId: number, status: string) {
        this.server.to(`order_${orderId}`).emit('order_status_updated', { status });
    }
}