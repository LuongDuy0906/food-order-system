import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EventsGateway } from 'src/events/events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()), // 👈 Phải import cái này thì Gateway mới dùng được JwtService
    ConfigModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, EventsGateway],
})
export class OrdersModule {}
