import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTableDto: CreateTableDto) {
    return await this.prisma.table.create({
      data: {
        number: createTableDto.number,
        capacity: createTableDto.capacity,
        floor: createTableDto.floor,
        isVip: createTableDto.isVip
      },
    });
  }

  async findAll() {
    return await this.prisma.table.findMany();
  }

  async findOne(number: string) {
    return await this.prisma.table.findUnique({
      select: {
        id: true,
        number: true,
      },
      where: { number },
    });
  }

  async update(id: number, updateTableDto: UpdateTableDto) {
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
    return await this.prisma.table.delete({
      where: { id },
    });
  }
}
