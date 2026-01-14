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
exports.ExamController = void 0;
const common_1 = require("@nestjs/common");
const exam_service_1 = require("./exam.service");
const position_service_1 = require("./position.service");
const exam_dto_1 = require("./dto/exam.dto");
const position_dto_1 = require("./dto/position.dto");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const tenant_guard_1 = require("../auth/tenant.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let ExamController = class ExamController {
    examService;
    positionService;
    constructor(examService, positionService) {
        this.examService = examService;
        this.positionService = positionService;
    }
    async getAll() {
        const exams = await this.examService.findAll();
        return api_result_dto_1.ApiResult.ok(exams);
    }
    async getById(id) {
        const exam = await this.examService.findById(id);
        return api_result_dto_1.ApiResult.ok(exam);
    }
    async create(request, req) {
        const exam = await this.examService.create(request, req.user.userId);
        return api_result_dto_1.ApiResult.ok(exam, 'Exam created successfully');
    }
    async update(id, request) {
        const exam = await this.examService.update(id, request);
        return api_result_dto_1.ApiResult.ok(exam, 'Exam updated successfully');
    }
    async delete(id) {
        await this.examService.delete(id);
        return api_result_dto_1.ApiResult.ok(null, 'Exam deleted successfully');
    }
    async open(id) {
        const exam = await this.examService.updateStatus(id, 'OPEN');
        return api_result_dto_1.ApiResult.ok(exam, 'Exam registration opened');
    }
    async close(id) {
        const exam = await this.examService.updateStatus(id, 'CLOSED');
        return api_result_dto_1.ApiResult.ok(exam, 'Exam registration closed');
    }
    async getPositions(examId) {
        const positions = await this.positionService.findByExamId(examId);
        return api_result_dto_1.ApiResult.ok(positions);
    }
    async createPosition(request) {
        const position = await this.positionService.create(request);
        return api_result_dto_1.ApiResult.ok(position, 'Position created successfully');
    }
    async deletePosition(id) {
        await this.positionService.delete(id);
        return api_result_dto_1.ApiResult.ok(null, 'Position deleted successfully');
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('exam:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('exam:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('exam:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exam_dto_1.ExamCreateRequest, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('exam:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_dto_1.ExamUpdateRequest]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('exam:delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/open'),
    (0, permissions_decorator_1.Permissions)('exam:open'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "open", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, permissions_decorator_1.Permissions)('exam:close'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "close", null);
__decorate([
    (0, common_1.Get)(':id/positions'),
    (0, permissions_decorator_1.Permissions)('position:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getPositions", null);
__decorate([
    (0, common_1.Post)('positions'),
    (0, permissions_decorator_1.Permissions)('position:create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [position_dto_1.PositionCreateRequest]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Delete)('positions/:id'),
    (0, permissions_decorator_1.Permissions)('position:delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "deletePosition", null);
exports.ExamController = ExamController = __decorate([
    (0, common_1.Controller)('exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [exam_service_1.ExamService,
        position_service_1.PositionService])
], ExamController);
//# sourceMappingURL=exam.controller.js.map