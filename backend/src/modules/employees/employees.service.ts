import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from "bcrypt"

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createEmployeeDto: CreateEmployeeDto) {
    const hashPassword = await bcrypt.hash("1234567", 10);

    const newUser: any = {};
    newUser['username'] = createEmployeeDto.email;
    newUser['password'] = hashPassword;
    if (createEmployeeDto.role) {
      newUser['role'] = createEmployeeDto.role;
    }

    return await this.prisma.employee.create({
      data: {
        name: createEmployeeDto.name.toLowerCase(),
        address: createEmployeeDto.address,
        email: createEmployeeDto.email,
        birthday: new Date(createEmployeeDto.birthday),
        phone: createEmployeeDto.phone,
        user: {
          create: newUser
        }
      }
    });
  }

  async findAll() {
    return await this.prisma.employee.findMany();
  }

  async findEmployee(name: string) {
    return await this.prisma.employee.findMany({
      where: {
        email: name
      }
    });
  }

  update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const newEmployeeData: any = {};

    if (updateEmployeeDto.name) {
      newEmployeeData['name'] = updateEmployeeDto.name;
    }
    if (updateEmployeeDto.address) {
      newEmployeeData['address'] = updateEmployeeDto.address;
    }
    if (updateEmployeeDto.email) {
      newEmployeeData['email'] = updateEmployeeDto.email;
    }
    if (updateEmployeeDto.birthday) {
      newEmployeeData['birthday'] = new Date(updateEmployeeDto.birthday);
    }
    if (updateEmployeeDto.phone) {
      newEmployeeData['phone'] = updateEmployeeDto.phone;
    }

    return this.prisma.employee.update({
      where: {
        id: id
      },
      data: newEmployeeData
    });
  }

  async remove(id: number) {
    return await this.prisma.employee.delete({
      where: {
        id: id
      }
    });
  }
}
