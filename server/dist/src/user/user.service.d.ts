import { PrismaService } from '../prisma/prisma.service';
import { UserResponse, UserTenantRoleResponse } from './dto/user.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get client();
    findById(id: string): Promise<UserResponse>;
    findMyTenants(userId: string): Promise<UserTenantRoleResponse[]>;
    private mapToResponse;
}
