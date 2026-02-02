import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

class OrderItemDto {
    @ApiProperty({ example: 1, description: 'The ID of the product.' })
    @IsNotEmpty({ message: "Mã sản phẩm không được để trống." })
    @IsNumber()
    productId: number;

    @Min(1, { message: "Số lượng sản phẩm phải lớn hơn 0." })
    @IsNumber()
    @ApiProperty({ example: 2, description: 'The quantity of the product ordered.' })
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({ type: [OrderItemDto]})
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ example: 5, description: 'The table number for the order.' })
    @IsNotEmpty({ message: "Số bàn không được để trống." })
    tableNumber: string;

    @IsString()
    @IsNotEmpty()
    tempId: string;
}
