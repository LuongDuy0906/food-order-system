import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTableDto {
    @ApiProperty()
    @IsNotEmpty({message: "Số bàn không được để trống."})
    @IsString()
    number: string;

    @ApiProperty()
    @IsNotEmpty({message: "Sức chứa không được để trống."})
    @IsNumber()
    capacity: number;

    @ApiProperty()
    @IsNotEmpty({message: "Vị trí VIP không được để trống."})
    @IsNumber()
    floorId: number

    @ApiProperty()
    @IsOptional()
    isVip: boolean;
}
