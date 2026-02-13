import { PrismaService } from '../prisma/prisma.service';
import { TenantBucketService } from './tenant-bucket.service';
export declare class TenantService {
    private readonly prisma;
    private readonly tenantBucketService;
    private readonly logger;
    constructor(prisma: PrismaService, tenantBucketService: TenantBucketService);
    createTenant(data: {
        id: string;
        name: string;
        code: string;
        schemaName: string;
        contactEmail: string;
    }): Promise<{
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
    private createTenantStorage;
    private initializeTenantSchema;
    private verifySchemaInitialization;
    findAll(): Promise<{
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
    }[]>;
}
