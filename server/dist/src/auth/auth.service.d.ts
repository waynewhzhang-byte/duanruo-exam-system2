import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(username: string, pass: string): Promise<User | null>;
    login(user: User): Promise<{
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
    }>;
    private getPermissionsForRoles;
    selectTenant(userId: string, tenantId: string): Promise<{
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
    }>;
    getMe(userId: string): Promise<{
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
    }>;
    refreshToken(userId: string): Promise<{
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
    }>;
}
