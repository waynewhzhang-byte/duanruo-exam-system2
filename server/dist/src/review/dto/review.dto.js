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
exports.DecisionTaskRequest = exports.PullTaskRequest = exports.BatchReviewRequest = exports.ReviewDecisionRequest = exports.ReviewStage = void 0;
const class_validator_1 = require("class-validator");
var ReviewStage;
(function (ReviewStage) {
    ReviewStage["PRIMARY"] = "PRIMARY";
    ReviewStage["SECONDARY"] = "SECONDARY";
})(ReviewStage || (exports.ReviewStage = ReviewStage = {}));
class ReviewDecisionRequest {
    applicationId;
    newStatus;
    decision;
    stage;
    evidenceFileIds;
}
exports.ReviewDecisionRequest = ReviewDecisionRequest;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReviewDecisionRequest.prototype, "applicationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewDecisionRequest.prototype, "newStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewDecisionRequest.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewDecisionRequest.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ReviewDecisionRequest.prototype, "evidenceFileIds", void 0);
class BatchReviewRequest {
    applicationIds;
    approve;
    reason;
}
exports.BatchReviewRequest = BatchReviewRequest;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BatchReviewRequest.prototype, "applicationIds", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BatchReviewRequest.prototype, "approve", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchReviewRequest.prototype, "reason", void 0);
class PullTaskRequest {
    examId;
    stage;
    preferredPositionId;
}
exports.PullTaskRequest = PullTaskRequest;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PullTaskRequest.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ReviewStage),
    __metadata("design:type", String)
], PullTaskRequest.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PullTaskRequest.prototype, "preferredPositionId", void 0);
class DecisionTaskRequest {
    taskId;
    approve;
    reason;
    evidenceFileIds;
}
exports.DecisionTaskRequest = DecisionTaskRequest;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DecisionTaskRequest.prototype, "taskId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DecisionTaskRequest.prototype, "approve", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecisionTaskRequest.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], DecisionTaskRequest.prototype, "evidenceFileIds", void 0);
//# sourceMappingURL=review.dto.js.map