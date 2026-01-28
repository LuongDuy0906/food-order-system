import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from "bcrypt"

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createProfileDto: CreateProfileDto) {
    const hashPassword = await bcrypt.hash("1234567", 10);

    const newUser: any = {};
    newUser['username'] = createProfileDto.email;
    newUser['password'] = hashPassword;
    if (createProfileDto.role) {
      newUser['role'] = createProfileDto.role;
    }

    return await this.prisma.profile.create({
      data: {
        name: createProfileDto.name.toLowerCase(),
        address: createProfileDto.address,
        email: createProfileDto.email,
        birthday: new Date(createProfileDto.birthday),
        phone: createProfileDto.phone,
        user: {
          create: newUser
        }
      }
    });
  }

  async findAll() {
    return await this.prisma.profile.findMany();
  }

  async findProfile(name: string) {
    return await this.prisma.profile.findMany({
      where: {
        email: name
      }
    });
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  async remove(id: number) {
    return await this.prisma.profile.delete({
      where: {
        id: id
      }
    });
  }
}
