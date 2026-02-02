import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs  from 'fs';
import { join } from 'path';
import { Product } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, imagesUrl: string): Promise<Product> {
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: Number(createProductDto.price),
        isEnable: createProductDto.isEnable,
        categoryId: Number(createProductDto.categoryId),
        images: {
          create: {
            url: imagesUrl,
            isPrimary: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<Product[]>{
    return await this.prisma.product.findMany({
      include: {
        images: true,
        category: true,
      },
    });
  }

  async findOne(id: number){
    return await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
      },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto, newImage: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { 
        images: true 
      },
    });

    if(!product){
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }

    const newProduct = {};
    if(updateProductDto.name){
      newProduct['name'] = updateProductDto.name;
    }
    if(updateProductDto.price){
      newProduct['price'] = Number(updateProductDto.price);
    }
    if(updateProductDto.description){
      newProduct['description'] = updateProductDto.description;
    }
    if(updateProductDto.isEnable){
      newProduct['isEnable'] = updateProductDto.isEnable;
    }
    if(updateProductDto.categoryId){
      newProduct['categoryId'] = Number(updateProductDto.categoryId);
    }

    if(newImage.length > 0){
      this.deleteFromDisk(product.images);

      newProduct['images'] = {
        deleteMany: {},
        create: {
          url: newImage,
          isPrimary: true,
        },
      };
    }

    return await this.prisma.product.update({
      where: { id },
      data: newProduct,
      include: { images: true },
    });
  }

  async remove(id: number): Promise<void> {
    const product =  await this.prisma.product.findUnique({
      where: { id },
      include: { 
        images: true 
      },
    });

    if(!product){
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }

    try {
      await this.prisma.product.delete({
        where: { id },
        include: { images: true },
      });
      this.deleteFromDisk(product.images);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Xóa sản phẩm thất bại');
    }
  }

  private deleteFromDisk(images: any[]) {
    images.forEach(image => {
      try {
        const filePath = join(process.cwd(), image.url);
        if(fs.existsSync(filePath)){
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        throw new InternalServerErrorException('Xoa file anh that bai');
      }
    })
  }
}
