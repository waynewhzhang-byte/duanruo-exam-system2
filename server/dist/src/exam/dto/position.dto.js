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
exports.PositionResponse = exports.SubjectResponse = exports.PositionCreateRequest = exports.SubjectCreateRequest = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SubjectCreateRequest {
    name;
    durationMinutes;
    type;
    maxScore;
    passingScore;
    weight;
    ordering;
}
exports.SubjectCreateRequest = SubjectCreateRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubjectCreateRequest.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubjectCreateRequest.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubjectCreateRequest.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubjectCreateRequest.prototype, "maxScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubjectCreateRequest.prototype, "passingScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubjectCreateRequest.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubjectCreateRequest.prototype, "ordering", void 0);
class PositionCreateRequest {
    examId;
    code;
    title;
    description;
    requirements;
    quota;
    subjects;
}
exports.PositionCreateRequest = PositionCreateRequest;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PositionCreateRequest.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PositionCreateRequest.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PositionCreateRequest.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PositionCreateRequest.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PositionCreateRequest.prototype, "requirements", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PositionCreateRequest.prototype, "quota", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SubjectCreateRequest),
    __metadata("design:type", Array)
], PositionCreateRequest.prototype, "subjects", void 0);
class SubjectResponse {
    id;
    name;
    durationMinutes;
    type;
    maxScore;
    passingScore;
    weight;
    ordering;
    createdAt;
}
exports.SubjectResponse = SubjectResponse;
class PositionResponse {
    id;
    examId;
    code;
    title;
    description;
    requirements;
    quota;
    subjects;
    createdAt;
}
exports.PositionResponse = PositionResponse;
//# sourceMappingURL=position.dto.js.map