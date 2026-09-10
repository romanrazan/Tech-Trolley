import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { CreateUserDto } from '../users/dtos/create-user.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    register(createUserDto: CreateUserDto): Promise<import("../users/entities/users.entity").User>;
    logout(): {
        message: string;
    };
}
