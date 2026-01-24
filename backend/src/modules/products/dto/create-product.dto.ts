import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString({message: "Tên sản phẩm phải là chuỗi ký tự."})
    @IsNotEmpty({message: "Tên sản phẩm không được để trống."})
    @ApiProperty({ example: 'Phở bò', description: 'The name of the product.' })
    name: string;

    @IsNotEmpty({message: "Giá sản phẩm không được để trống."})
    @IsNumber({}, {message: "Giá sản phẩm phải là một số."})
    @ApiProperty({ example: 50000, description: 'The price of the product in VND.' })
    price: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Phở bò tái chín, nước dùng thơm ngon, bánh phở mềm mại.', description: 'A brief description of the product.' })
    description?: string;

    @IsNotEmpty({message: "Số lượng sản phẩm không được để trống."})
    @IsNumber({}, {message: "Số lượng sản phẩm phải là một số."})
    @ApiProperty({ example: 100, description: 'The available quantity of the product in stock.' })
    quantity: number;

    @IsDefined()
    @Type(() => Number)
    @ApiProperty({ example: 1, description: 'The category ID to which the product belongs.' })
    categoryId: number;
}
