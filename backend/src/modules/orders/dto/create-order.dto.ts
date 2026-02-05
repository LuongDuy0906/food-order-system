import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class OrderItemDto {
    @ApiProperty({ example: 1, description: 'Id sản phẩm' })
    @IsNotEmpty({ message: "Mã sản phẩm không được để trống." })
    @IsNumber()
    productId: number;

    @Min(1, { message: "Số lượng sản phẩm phải lớn hơn 0." })
    @IsNumber()
    @ApiProperty({ example: 2, description: 'Số lương sản phẩm' })
    quantity: number;

    @ApiProperty()
    @IsOptional()
    note: string
}

export class CreateOrderDto {
    @ApiProperty({ type: [OrderItemDto]})
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ example: 5, description: 'Bàn' })
    @IsNotEmpty({ message: "Số bàn không được để trống." })
    tableNumber: string;

    @ApiProperty({example: "1244556", description: "Key tạm để tham gia hàng chờ."})
    @IsString()
    @IsNotEmpty()
    tempId: string;
}
