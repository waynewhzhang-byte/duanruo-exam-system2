"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_bucket_service_1 = require("./tenant-bucket.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let TenantService = TenantService_1 = class TenantService {
    prisma;
    tenantBucketService;
    logger = new common_1.Logger(TenantService_1.name);
    constructor(prisma, tenantBucketService) {
        this.prisma = prisma;
        this.tenantBucketService = tenantBucketService;
    }
    async createTenant(data) {
        return await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    id: data.id,
                    name: data.name,
                    code: data.code,
                    schemaName: data.schemaName,
                    contactEmail: data.contactEmail,
                    status: 'ACTIVE',
                },
            });
            await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${data.schemaName}"`);
            await this.initializeTenantSchema(tx, data.schemaName);
            await this.createTenantStorage(data.code);
            return tenant;
        });
    }
    async createTenantStorage(tenantCode) {
        try {
            await this.tenantBucketService.createTenantBucket(tenantCode);
            this.logger.log(`Successfully created storage bucket for tenant: ${tenantCode}`);
        }
        catch (error) {
            this.logger.error(`Failed to create storage bucket for tenant ${tenantCode}, but tenant creation succeeded. Bucket can be created manually.`, error.stack);
        }
    }
    async initializeTenantSchema(tx, schemaName) {
        try {
            this.logger.log(`Initializing schema: ${schemaName}`);
            const templatePath = path.join(__dirname, 'tenant-schema-template.sql');
            if (!fs.existsSync(templatePath)) {
                throw new Error(`SQL template file not found at: ${templatePath}`);
            }
            const sqlTemplate = fs.readFileSync(templatePath, 'utf-8');
            await tx.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
            const statements = sqlTemplate
                .split(';')
                .map((stmt) => stmt.trim())
                .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));
            for (const statement of statements) {
                if (statement.length > 0) {
                    await tx.$executeRawUnsafe(statement);
                }
            }
            this.logger.log(`Successfully initialized schema: ${schemaName} with ${statements.length} statements`);
            await this.verifySchemaInitialization(tx, schemaName);
            this.logger.log(`Schema verification passed: ${schemaName}`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize schema: ${schemaName}`, error.stack);
            throw new common_1.InternalServerErrorException(`Failed to initialize schema ${schemaName}: ${error.message}`);
        }
    }
    async verifySchemaInitialization(tx, schemaName) {
        const criticalTables = [
            'exams',
            'positions',
            'subjects',
            'applications',
            'review_tasks',
            'reviews',
            'tickets',
            'payment_orders',
        ];
        for (const tableName of criticalTables) {
            const result = await tx.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1
          AND table_name = $2
        ) as exists
      `, schemaName, tableName);
            if (!result[0]?.exists) {
                throw new Error(`Critical table '${tableName}' not found in schema '${schemaName}'`);
            }
        }
        this.logger.debug(`All ${criticalTables.length} critical tables verified in ${schemaName}`);
    }
    async findAll() {
        return this.prisma.tenant.findMany();
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = TenantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_bucket_service_1.TenantBucketService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map