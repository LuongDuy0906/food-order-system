import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EventsGateway } from 'src/events/events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { ClientsModule } from '@nestjs/microservices';
import rabbitMqConfig from 'src/config/rabbit-mq.config';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'ORDER_SERVICE',
        inject: [rabbitMqConfig.KEY],
        useFactory: (config: ConfigType<typeof rabbitMqConfig>) => {
          return config;
        }
      }
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, EventsGateway],
})
export class OrdersModule {}
