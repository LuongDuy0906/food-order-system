import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Table } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    return await this.prisma.table.create({
      data: {
        number: createTableDto.number,
        capacity: createTableDto.capacity,
        floorId: createTableDto.floorId
      },
    });
  }

  async findAll(): Promise<Table[]> {
    return await this.prisma.table.findMany();
  }

  async findOne(number: string): Promise<Table | any> {
    return await this.prisma.table.findUnique({
      select: {
        id: true,
        number: true,
      },
      where: { number },
    });
  }

  async update(id: number, updateTableDto: UpdateTableDto): Promise<Table>{
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if(!table){
      throw new NotFoundException("Table not found");
    }

    const newTable: any = {};
    if(updateTableDto.number){
      newTable['number'] = updateTableDto.number;
    }
    if(updateTableDto.capacity){
      newTable['capacity'] = Number(updateTableDto.capacity);
    }

    return await this.prisma.table.update({
      where: { id },
      data: newTable,
    });
  }

  async remove(id: number) {
    await this.prisma.table.delete({
      where: { id },
    });
  }
}
