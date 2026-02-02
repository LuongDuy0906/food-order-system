import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/auth/guards/roles/roles.guard';
import { ConfigModule } from '@nestjs/config';
import rabbitMqConfig from './config/rabbit-mq.config';

@Module({
  imports: [
    ProductsModule, 
    PrismaModule, 
    TablesModule, 
    OrdersModule, 
    EmployeesModule, 
    UsersModule, 
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitMqConfig]
    })
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
  
})
export class AppModule {}
