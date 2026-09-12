import { UserRole } from '../../auth/user-role.enum';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
}
