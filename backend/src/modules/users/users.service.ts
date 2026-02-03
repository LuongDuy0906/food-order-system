import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService){}

  async create(createUserDto: CreateUserDto) {
    const hashPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        username: createUserDto.username,
        password: hashPassword,
        role: createUserDto.role
      }
    })
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        name: true,
        username: true,
        role: true
      }
    });
  }

  async findOneByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: {
        username: username
      }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existUser = this.prisma.user.findUnique({
      where: {
        id: id
      }
    });

    if(!existUser){
      throw new NotFoundException("Nhân viên không tồn tại");
    }

    let newUser: any = {};
    if(updateUserDto.name){
      newUser['name'] = updateUserDto.name;
    }
    if(updateUserDto.username){
      newUser['username'] = updateUserDto.username;
    }
    if(updateUserDto.password){
      const newPassword = await bcrypt.hash(updateUserDto.password, 10);
      newUser['password'] = newPassword;
    }
    if(updateUserDto.role){
      newUser['role'] = updateUserDto.role;
    }
    return await this.prisma.user.update({
      where: {
        id: id
      },
      data: newUser
    });
  }

  async remove(id: number) {
    const existUser = this.prisma.user.findUnique({
      where: {
        id: id
      }
    });

    if(!existUser){
      throw new NotFoundException("Nhân viên không tồn tại");
    }

    return this.prisma.user.delete({
      where: {
        id: id
      }
    });
  }
}
