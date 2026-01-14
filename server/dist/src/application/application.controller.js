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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationController = void 0;
const common_1 = require("@nestjs/common");
const application_service_1 = require("./application.service");
const application_dto_1 = require("./dto/application.dto");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const tenant_guard_1 = require("../auth/tenant.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let ApplicationController = class ApplicationController {
    applicationService;
    constructor(applicationService) {
        this.applicationService = applicationService;
    }
    async getMyApplications(req) {
        const apps = await this.applicationService.listMyEnriched(req.user.userId);
        return api_result_dto_1.ApiResult.ok(apps);
    }
    async getMyDrafts(req) {
        const drafts = await this.applicationService.listMyDrafts(req.user.userId);
        return api_result_dto_1.ApiResult.ok(drafts);
    }
    async submit(request, req) {
        const app = await this.applicationService.submit(req.user.userId, request);
        return api_result_dto_1.ApiResult.ok(app, 'Application submitted successfully');
    }
    async saveDraft(request, req) {
        const app = await this.applicationService.saveDraft(req.user.userId, request);
        return api_result_dto_1.ApiResult.ok(app, 'Draft saved successfully');
    }
    async getById(id) {
        const app = await this.applicationService.findById(id);
        return api_result_dto_1.ApiResult.ok(app);
    }
};
exports.ApplicationController = ApplicationController;
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('application:view:own'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationController.prototype, "getMyApplications", null);
__decorate([
    (0, common_1.Get)('drafts/my'),
    (0, permissions_decorator_1.Permissions)('application:view:own'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationController.prototype, "getMyDrafts", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('application:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [application_dto_1.ApplicationSubmitRequest, Object]),
    __metadata("design:returntype", Promise)
], ApplicationController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('drafts'),
    (0, permissions_decorator_1.Permissions)('application:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [application_dto_1.ApplicationSubmitRequest, Object]),
    __metadata("design:returntype", Promise)
], ApplicationController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('application:view:own'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApplicationController.prototype, "getById", null);
exports.ApplicationController = ApplicationController = __decorate([
    (0, common_1.Controller)('applications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [application_service_1.ApplicationService])
], ApplicationController);
//# sourceMappingURL=application.controller.js.map