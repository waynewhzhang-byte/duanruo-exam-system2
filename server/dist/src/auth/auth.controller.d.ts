import { AuthService } from './auth.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { LoginRequestDto, SelectTenantDto } from './dto/auth.dto';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginRequestDto): Promise<ApiResult<{
        token: string;
        tokenType: string;
        expiresIn: number;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            status: string;
            roles: string[];
            permissions: string[];
            emailVerified: boolean;
            phoneVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>>;
    selectTenant(body: SelectTenantDto, req: AuthenticatedRequest): Promise<ApiResult<{
        token: string;
        tokenType: string;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            status: string;
            roles: string[];
            permissions: string[];
            emailVerified: boolean;
            phoneVerified: boolean;
            createdAt: string;
            updatedAt: string;
        };
    }>>;
    getMe(req: AuthenticatedRequest): Promise<ApiResult<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        status: string;
        roles: string[];
        permissions: string[];
        emailVerified: boolean;
        phoneVerified: boolean;
        createdAt: string;
        updatedAt: string;
    }>>;
    logout(): ApiResult<null>;
}
