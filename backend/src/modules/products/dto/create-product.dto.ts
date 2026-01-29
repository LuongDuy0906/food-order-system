import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString({message: "Tên sản phẩm phải là chuỗi ký tự."})
    @IsNotEmpty({message: "Tên sản phẩm không được để trống."})
    @ApiProperty({ example: 'Phở bò', description: 'The name of the product.' })
    name: string;

    @IsNotEmpty({message: "Giá sản phẩm không được để trống."})
    @Type(() => Number)
    @IsNumber({}, {message: "Giá sản phẩm phải là một số."})
    @ApiProperty({ example: 50000, description: 'The price of the product in VND.' })
    price: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Phở bò tái chín, nước dùng thơm ngon, bánh phở mềm mại.', description: 'A brief description of the product.' })
    description?: string;

    @ApiProperty()
    @Type(() => Boolean)
    @IsBoolean()
    isEnable: boolean

    @IsDefined()
    @Type(() => Number)
    @ApiProperty({ example: 1, description: 'The category ID to which the product belongs.' })
    categoryId: number;

    @ApiProperty({ 
        description: 'The URL of the product image.', 
        type: 'array',
        items: { 
            type: 'string',
            format: 'binary'
        },
    })
    @IsOptional()
    image?: string;
}
