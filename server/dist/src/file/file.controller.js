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
var FileController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const common_1 = require("@nestjs/common");
const file_service_1 = require("./file.service");
const file_dto_1 = require("./dto/file.dto");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const tenant_guard_1 = require("../auth/tenant.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let FileController = FileController_1 = class FileController {
    fileService;
    logger = new common_1.Logger(FileController_1.name);
    constructor(fileService) {
        this.fileService = fileService;
    }
    async getUploadUrl(request, req) {
        const tenantId = req.user.tenantId || req.headers['x-tenant-id'];
        const result = await this.fileService.generateUploadUrl(tenantId, req.user.userId, request);
        return api_result_dto_1.ApiResult.ok(result);
    }
    async confirmUpload(id, request, req) {
        const tenantId = req.user.tenantId || req.headers['x-tenant-id'];
        const file = await this.fileService.confirmUpload(tenantId, id, request.fileSize);
        const response = {
            fileId: file.id,
            status: file.status,
            originalName: file.originalName,
            fileSize: Number(file.fileSize || 0),
            contentType: file.contentType || '',
            virusScanStatus: file.virusScanStatus,
            uploadedAt: file.updatedAt,
            message: '文件上传确认成功',
        };
        return api_result_dto_1.ApiResult.ok(response);
    }
    async getDownloadUrl(id, req) {
        const tenantId = req.user.tenantId || req.headers['x-tenant-id'];
        const result = await this.fileService.getDownloadUrl(tenantId, id);
        return api_result_dto_1.ApiResult.ok(result);
    }
    async getBatchInfo(request) {
        const result = await this.fileService.getBatchFileInfo(request.fileIds);
        return api_result_dto_1.ApiResult.ok(result);
    }
    async getFileInfo(id) {
        const file = await this.fileService.findById(id);
        if (!file)
            throw new Error('File not found');
        const response = {
            id: file.id,
            originalName: file.originalName,
            storedName: file.storedName,
            objectKey: file.objectKey,
            contentType: file.contentType || '',
            fileSize: Number(file.fileSize || 0),
            status: file.status,
            virusScanStatus: file.virusScanStatus,
            uploadedAt: file.createdAt,
        };
        return api_result_dto_1.ApiResult.ok(response);
    }
};
exports.FileController = FileController;
__decorate([
    (0, common_1.Post)('upload-url'),
    (0, permissions_decorator_1.Permissions)('file:upload'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [file_dto_1.FileUploadUrlRequest, Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.Permissions)('file:upload'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, file_dto_1.FileConfimRequest, Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Get)(':id/download-url'),
    (0, permissions_decorator_1.Permissions)('file:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Post)('batch-info'),
    (0, permissions_decorator_1.Permissions)('file:view'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [file_dto_1.FileBatchInfoRequest]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "getBatchInfo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('file:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "getFileInfo", null);
exports.FileController = FileController = FileController_1 = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [file_service_1.FileService])
], FileController);
//# sourceMappingURL=file.controller.js.map