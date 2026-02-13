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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(username, pass) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            return user;
        }
        return null;
    }
    async login(user) {
        const tenantRoles = await this.prisma.userTenantRole.findMany({
            where: {
                userId: user.id,
                active: true,
            },
            include: { tenant: true },
        });
        let roles = JSON.parse(user.roles);
        let tenantId = null;
        if (tenantRoles.length > 0) {
            const primaryTenantRole = tenantRoles[0];
            tenantId = primaryTenantRole.tenantId;
            roles = Array.from(new Set([...roles, primaryTenantRole.role]));
        }
        const permissions = this.getPermissionsForRoles(roles);
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            roles: roles,
            tenantId: tenantId,
            permissions: permissions,
        };
        const resultUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            roles: roles,
            permissions: permissions,
            emailVerified: user.emailVerified ?? false,
            phoneVerified: user.phoneVerified ?? false,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
        return {
            token: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            expiresIn: 86400,
            user: resultUser,
        };
    }
    getPermissionsForRoles(roles) {
        const permissions = new Set();
        permissions.add('application:view:own');
        permissions.add('application:create');
        permissions.add('file:upload');
        permissions.add('file:view:own');
        permissions.add('ticket:view:own');
        permissions.add('payment:initiate');
        if (roles.includes('SUPER_ADMIN')) {
            permissions.add('tenant:view:all');
            permissions.add('tenant:create');
            permissions.add('user:manage');
            permissions.add('statistics:system:view');
        }
        if (roles.includes('TENANT_ADMIN')) {
            permissions.add('exam:create');
            permissions.add('exam:view');
            permissions.add('exam:edit');
            permissions.add('exam:delete');
            permissions.add('exam:publish');
            permissions.add('exam:open');
            permissions.add('exam:close');
            permissions.add('position:create');
            permissions.add('position:view');
            permissions.add('position:delete');
            permissions.add('statistics:tenant:view');
        }
        if (roles.includes('PRIMARY_REVIEWER')) {
            permissions.add('review:primary');
            permissions.add('review:view');
            permissions.add('review:perform');
        }
        if (roles.includes('SECONDARY_REVIEWER')) {
            permissions.add('review:secondary');
            permissions.add('review:view');
            permissions.add('review:perform');
        }
        return Array.from(permissions);
    }
    async selectTenant(userId, tenantId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isSuperAdmin = JSON.parse(user.roles).includes('SUPER_ADMIN');
        const tenantRole = await this.prisma.userTenantRole.findFirst({
            where: {
                userId,
                tenantId,
                active: true,
            },
        });
        if (!isSuperAdmin && !tenantRole) {
            throw new common_1.UnauthorizedException('No access to this tenant');
        }
        const roles = Array.from(new Set([
            ...JSON.parse(user.roles),
            ...(tenantRole ? [tenantRole.role] : []),
        ]));
        const permissions = this.getPermissionsForRoles(roles);
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            tenantId: tenantId,
            roles: roles,
            permissions: permissions,
            status: user.status,
        };
        return {
            token: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                status: user.status,
                roles: roles,
                permissions: permissions,
                emailVerified: user.emailVerified ?? false,
                phoneVerified: user.phoneVerified ?? false,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const tenantRoles = await this.prisma.userTenantRole.findMany({
            where: { userId: user.id, active: true },
        });
        const roles = Array.from(new Set([
            ...JSON.parse(user.roles),
            ...tenantRoles.map((tr) => tr.role),
        ]));
        const permissions = this.getPermissionsForRoles(roles);
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            roles: roles,
            permissions: permissions,
            emailVerified: user.emailVerified ?? false,
            phoneVerified: user.phoneVerified ?? false,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    async refreshToken(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const tenantRoles = await this.prisma.userTenantRole.findMany({
            where: { userId: user.id, active: true },
        });
        const roles = Array.from(new Set([
            ...JSON.parse(user.roles),
            ...tenantRoles.map((tr) => tr.role),
        ]));
        const permissions = this.getPermissionsForRoles(roles);
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            roles: roles,
            permissions: permissions,
        };
        return {
            token: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            expiresIn: 86400,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                status: user.status,
                roles: roles,
                permissions: permissions,
                emailVerified: user.emailVerified ?? false,
                phoneVerified: user.phoneVerified ?? false,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map