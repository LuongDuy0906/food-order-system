import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService){}

    async findAll(): Promise<any[]>{
        return await this.prisma.category.findMany({
            select: {
                id: true,
                name: true
            }
        })
    }
}
