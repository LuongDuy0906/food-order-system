import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class LoginDto{
    @ApiProperty({example: 'username'})
    @IsNotEmpty({message: 'Tên người dùng không được để trống'})
    username: string;

    @ApiProperty({example: 'password'})
    @IsNotEmpty({message: 'Mật khẩu không được để trống'})
    password: string;
}