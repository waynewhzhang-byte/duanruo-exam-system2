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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const review_service_1 = require("./review.service");
const api_result_dto_1 = require("../common/dto/api-result.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const tenant_guard_1 = require("../auth/tenant.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const review_dto_1 = require("./dto/review.dto");
let ReviewController = class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async pullTask(req, request) {
        const result = await this.reviewService.pullNext(req.user.userId, request);
        if (!result) {
            return api_result_dto_1.ApiResult.ok(null, 'No tasks available in queue');
        }
        return api_result_dto_1.ApiResult.ok(result);
    }
    async decide(req, request) {
        const result = await this.reviewService.decide(req.user.userId, request);
        return api_result_dto_1.ApiResult.ok(result, 'Review decision recorded');
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)('pull'),
    (0, permissions_decorator_1.Permissions)('review:perform'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.PullTaskRequest]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "pullTask", null);
__decorate([
    (0, common_1.Post)('decide'),
    (0, permissions_decorator_1.Permissions)('review:perform'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.DecisionTaskRequest]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "decide", null);
exports.ReviewController = ReviewController = __decorate([
    (0, common_1.Controller)('reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map