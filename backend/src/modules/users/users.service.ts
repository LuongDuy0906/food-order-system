import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findOneByUsername(username: string){
        return await this.prisma.user.findUnique({
            where: {
                username: username
            }
        })
    };
}
