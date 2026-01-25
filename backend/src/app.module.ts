import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [ProductsModule, PrismaModule, TablesModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
