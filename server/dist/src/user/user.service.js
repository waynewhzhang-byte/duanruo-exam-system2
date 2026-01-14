"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async findById(id) {
        const user = await this.client.user.findUnique({
            where: { id },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.mapToResponse(user);
    }
    async findMyTenants(userId) {
        const roles = await this.client.userTenantRole.findMany({
            where: { userId, active: true },
            include: { tenant: true },
        });
        return roles.map((r) => ({
            id: r.id,
            userId: r.userId,
            tenantId: r.tenantId,
            role: r.role,
            active: r.active,
            tenant: {
                id: r.tenant.id,
                name: r.tenant.name,
                code: r.tenant.code,
                schemaName: r.tenant.schemaName,
                status: r.tenant.status,
                contactEmail: r.tenant.contactEmail,
                contactPhone: r.tenant.contactPhone ?? undefined,
                createdAt: r.tenant.createdAt,
            },
        }));
    }
    mapToResponse(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber ?? undefined,
            status: user.status,
            roles: JSON.parse(user.roles),
            createdAt: user.createdAt,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map