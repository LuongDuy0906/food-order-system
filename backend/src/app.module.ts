import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FloorsController } from './modules/floors/floors.controller';
import { FloorsModule } from './modules/floors/floors.module';
import rabbitMqConfig from './config/rabbit-mq.config';

@Module({
  imports: [
    ProductsModule, 
    PrismaModule, 
    TablesModule, 
    OrdersModule, 
    UsersModule, 
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitMqConfig]
    }),
    CategoriesModule,
    FloorsModule
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
  
})
export class AppModule {}
