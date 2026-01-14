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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminController = void 0;
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_service_1 = require("../tenant/tenant.service");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
let SuperAdminController = class SuperAdminController {
    prisma;
    tenantService;
    constructor(prisma, tenantService) {
        this.prisma = prisma;
        this.tenantService = tenantService;
    }
    async getAllTenants(page = 0, size = 10) {
        const pageNum = Number(page);
        const sizeNum = Number(size);
        const skip = pageNum * sizeNum;
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                skip,
                take: sizeNum,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.tenant.count(),
        ]);
        const tenantsWithSlug = tenants.map((t) => ({
            ...t,
            slug: t.code,
        }));
        return paginated_response_dto_1.PaginationHelper.createResponse(tenantsWithSlug, total, pageNum, sizeNum);
    }
    async createTenant(dto) {
        const tenant = await this.tenantService.createTenant({
            id: crypto.randomUUID(),
            name: dto.name,
            code: dto.code,
            schemaName: `tenant_${dto.code}`,
            contactEmail: dto.contactEmail,
        });
        return api_result_dto_1.ApiResult.ok(tenant);
    }
    async activateTenant(id) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { status: 'ACTIVE', activatedAt: new Date() },
        });
        return api_result_dto_1.ApiResult.ok(tenant);
    }
    async deactivateTenant(id) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { status: 'INACTIVE', deactivatedAt: new Date() },
        });
        return api_result_dto_1.ApiResult.ok(tenant);
    }
    async deleteTenant(id) {
        await this.prisma.tenant.delete({
            where: { id },
        });
        return api_result_dto_1.ApiResult.ok(null, 'Tenant deleted');
    }
    async getAllUsers(page = 0, size = 10) {
        const pageNum = Number(page);
        const sizeNum = Number(size);
        const skip = pageNum * sizeNum;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: sizeNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    status: true,
                    roles: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count(),
        ]);
        return paginated_response_dto_1.PaginationHelper.createResponse(users, total, pageNum, sizeNum);
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('tenants'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAllTenants", null);
__decorate([
    (0, common_1.Post)('tenants'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Post)('tenants/:id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "activateTenant", null);
__decorate([
    (0, common_1.Post)('tenants/:id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deactivateTenant", null);
__decorate([
    (0, common_1.Delete)('tenants/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteTenant", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAllUsers", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)('super-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_service_1.TenantService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map