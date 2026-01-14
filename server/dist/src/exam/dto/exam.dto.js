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
exports.ExamResponse = exports.ExamUpdateRequest = exports.ExamCreateRequest = void 0;
const class_validator_1 = require("class-validator");
class ExamCreateRequest {
    code;
    title;
    description;
    announcement;
    registrationStart;
    registrationEnd;
    examStart;
    examEnd;
    feeRequired;
    feeAmount;
    slug;
}
exports.ExamCreateRequest = ExamCreateRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "announcement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "registrationStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "registrationEnd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "examStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "examEnd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExamCreateRequest.prototype, "feeRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ExamCreateRequest.prototype, "feeAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamCreateRequest.prototype, "slug", void 0);
class ExamUpdateRequest extends ExamCreateRequest {
    status;
}
exports.ExamUpdateRequest = ExamUpdateRequest;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamUpdateRequest.prototype, "status", void 0);
class ExamResponse {
    id;
    code;
    title;
    description;
    announcement;
    registrationStart;
    registrationEnd;
    examStart;
    examEnd;
    feeRequired;
    feeAmount;
    status;
    createdBy;
    createdAt;
    updatedAt;
}
exports.ExamResponse = ExamResponse;
//# sourceMappingURL=exam.dto.js.map