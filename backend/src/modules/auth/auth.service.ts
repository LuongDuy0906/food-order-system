import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-JwtPayload';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}

    private async validateUser(loginDto: LoginDto) {
        const existUser = await this.usersService.findOneByUsername(loginDto.username);
        if(!existUser) throw new NotFoundException('Người dùng không tồn tại');

        const isPasswordCorrect = await compare(loginDto.password, existUser.password);
        if(!isPasswordCorrect) throw new NotFoundException('Sai mật khẩu');

        return existUser;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto);
        const payload: AuthJwtPayload = {sub: user.id, username: user.username, role: user.role};
        return { 
            username: user.name,
            access_token: await this.jwtService.signAsync(payload)
        };

    }
}
