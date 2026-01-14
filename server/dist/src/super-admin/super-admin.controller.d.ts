import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
export declare class SuperAdminController {
    private readonly prisma;
    private readonly tenantService;
    constructor(prisma: PrismaService, tenantService: TenantService);
    getAllTenants(page?: number, size?: number): Promise<PaginatedResponse<Tenant & {
        slug: string;
    }>>;
    createTenant(dto: CreateTenantDto): Promise<ApiResult<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        schemaName: string;
        contactEmail: string;
        contactPhone: string | null;
        description: string | null;
        activatedAt: Date | null;
        deactivatedAt: Date | null;
    }>>;
    activateTenant(id: string): Promise<ApiResult<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        schemaName: string;
        contactEmail: string;
        contactPhone: string | null;
        description: string | null;
        activatedAt: Date | null;
        deactivatedAt: Date | null;
    }>>;
    deactivateTenant(id: string): Promise<ApiResult<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        schemaName: string;
        contactEmail: string;
        contactPhone: string | null;
        description: string | null;
        activatedAt: Date | null;
        deactivatedAt: Date | null;
    }>>;
    deleteTenant(id: string): Promise<ApiResult<null>>;
    getAllUsers(page?: number, size?: number): Promise<PaginatedResponse<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        status: string;
        roles: string;
        createdAt: Date;
    }>>;
}
