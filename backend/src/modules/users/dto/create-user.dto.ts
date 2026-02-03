import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @ApiProperty({example: "Tên nhân viên"})
    @IsString()
    @IsNotEmpty({message: "Tên nhân viên không được để trống"})
    name: string

    @ApiProperty({example: "Tài khoản"})
    @IsString()
    @IsNotEmpty({message: "Tài khoản không được để trống"})
    username: string

    @ApiProperty({example: "Mật khẩu"})
    @IsNotEmpty({message: "Mật khẩu không được để trống"})
    password: string

    @ApiProperty({example: "Vai trò"})
    @IsOptional()
    @IsEnum({Role}, {message: "Role không phù hợp"})
    role: Role
}
