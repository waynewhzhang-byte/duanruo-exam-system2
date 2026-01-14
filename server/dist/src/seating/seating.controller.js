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
exports.SeatingController = void 0;
const common_1 = require("@nestjs/common");
const seating_service_1 = require("./seating.service");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const seating_dto_1 = require("./dto/seating.dto");
let SeatingController = class SeatingController {
    seatingService;
    constructor(seatingService) {
        this.seatingService = seatingService;
    }
    async allocate(examId, request, req) {
        const userId = req.user.userId;
        const result = await this.seatingService.allocate(examId, request, userId);
        return api_result_dto_1.ApiResult.ok(result);
    }
    async listAssignments(examId) {
        const result = await this.seatingService.listAssignments(examId);
        return api_result_dto_1.ApiResult.ok(result);
    }
};
exports.SeatingController = SeatingController;
__decorate([
    (0, common_1.Post)(':examId/allocate'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, seating_dto_1.AllocateSeatsRequest, Object]),
    __metadata("design:returntype", Promise)
], SeatingController.prototype, "allocate", null);
__decorate([
    (0, common_1.Get)(':examId/assignments'),
    __param(0, (0, common_1.Param)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SeatingController.prototype, "listAssignments", null);
exports.SeatingController = SeatingController = __decorate([
    (0, common_1.Controller)('seating'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [seating_service_1.SeatingService])
], SeatingController);
//# sourceMappingURL=seating.controller.js.map