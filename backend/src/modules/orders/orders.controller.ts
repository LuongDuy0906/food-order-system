import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Inject } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject('ORDER_SERVICE')
    private readonly rabbitClient: ClientProxy
  ) {}

  @Post()
  placeOrder(@Body() createOrderDto: CreateOrderDto) {
    this.rabbitClient.emit('new_order', createOrderDto);

    return {
      message: 'Đơn hàng đang được xử lý',
      tempId: createOrderDto.tempId, 
      status: 'QUEUED'
    };
  }

  @EventPattern('new_order')
  async handleNewOrder(@Payload() data: CreateOrderDto) {
    await this.ordersService.processOrder(data);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  getTotalOrdersPerDay(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('type') type: string) {
    return this.ordersService.getTotalOrders(startDate, endDate, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WAITER)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Patch(':id/next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF, Role.WAITER)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string) {
    return this.ordersService.updateStatus(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WAITER)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WAITER)
  @ApiBearerAuth()
  checkout(@Param('id') id: string){
    return this.ordersService.checkout(+id);
  }


}
