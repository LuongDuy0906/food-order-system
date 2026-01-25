import { Type } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTableDto {
    @IsNotEmpty({message: "Số bàn không được để trống."})
    @IsString()
    number: string;

    @IsNotEmpty({message: "Sức chứa không được để trống."})
    @Type(() => Number)
    capacity: number;
}
