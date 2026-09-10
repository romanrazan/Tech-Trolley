import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UserRole } from '../auth/user-role.enum';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/users.entity").User>;
    findAll(): Promise<import("./entities/users.entity").User[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        createdAt: Date;
        sales?: import("../sales/entities/sale.entity").Sale[];
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./entities/users.entity").User>;
    updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto): Promise<import("./entities/users.entity").User>;
    remove(id: string): Promise<void>;
}
