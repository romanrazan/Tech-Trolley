import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { CreateUserDto } from '../users/dtos/create-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    register(createUserDto: CreateUserDto): Promise<import("../users/entities/users.entity").User>;
    logout(): {
        message: string;
    };
    getMe(req: any): any;
}
