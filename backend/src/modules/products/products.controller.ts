import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { editFileName, imageFileFilter } from 'src/common/file-upload.utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles/roles.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo sản phẩm với ảnh minh họa.' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/products',
      filename: editFileName,
    }),
    fileFilter: imageFileFilter,
  }))
  create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    const imagesUrl = `/uploads/products/${file.filename}`;
    return this.productsService.create(createProductDto, imagesUrl);
  }

  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm với ảnh minh họa.' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/products',
      filename: editFileName,
    }),
    fileFilter: imageFileFilter,
  }))
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() file: Express.Multer.File) {
    const newImage = `/uploads/products/${file.filename}`;
    return this.productsService.update(+id, updateProductDto, newImage);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
