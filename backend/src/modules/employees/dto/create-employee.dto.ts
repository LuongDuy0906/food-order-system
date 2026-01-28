import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmployeeDto {
    @ApiProperty()
    @IsNotEmpty({message: "Tên không được để trống"})
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty({message: "Địa chỉ không được để trống"})
    @IsString()
    address: string

    @ApiProperty()
    @IsNotEmpty({message: "Email không được để trống"})
    @IsEmail({}, {message: "Email không hợp lệ"})
    email: string;

    @ApiProperty()
    @IsNotEmpty({message: "Ngày sinh không được để trống"})
    @IsDateString({}, {message: "Ngày sinh không hợp lệ"})
    birthday: string;

    @ApiProperty()
    @IsNotEmpty({message: "Số điện thoại không được để trống"})
    @IsString()
    phone: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(
        {
            ADMIN: 'ADMIN',
            CHEF: 'CHEF'
        },
        {message: "Vai trò không hợp lệ"}
    )
    role: string;
}
