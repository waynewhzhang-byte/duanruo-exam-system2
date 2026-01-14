import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class TenantController {
    private readonly tenantService;
    private readonly prisma;
    constructor(tenantService: TenantService, prisma: PrismaService);
    getBySlug(slug: string): Promise<{
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
    }>;
}
