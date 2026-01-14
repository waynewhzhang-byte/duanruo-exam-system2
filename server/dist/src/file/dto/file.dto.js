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
exports.FileBatchInfoResponse = exports.FileBatchInfoRequest = exports.PresignedUrlResponse = exports.FileInfoResponse = exports.FileUploadConfirmResponse = exports.FileUploadUrlResponse = exports.FileConfimRequest = exports.FileUploadUrlRequest = void 0;
const class_validator_1 = require("class-validator");
class FileUploadUrlRequest {
    fileName;
    contentType;
    fieldKey;
    applicationId;
}
exports.FileUploadUrlRequest = FileUploadUrlRequest;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FileUploadUrlRequest.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FileUploadUrlRequest.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FileUploadUrlRequest.prototype, "fieldKey", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FileUploadUrlRequest.prototype, "applicationId", void 0);
class FileConfimRequest {
    fileSize;
}
exports.FileConfimRequest = FileConfimRequest;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FileConfimRequest.prototype, "fileSize", void 0);
class FileUploadUrlResponse {
    fileId;
    uploadUrl;
    fileKey;
    fileName;
    contentType;
    fieldKey;
    expiresIn;
}
exports.FileUploadUrlResponse = FileUploadUrlResponse;
class FileUploadConfirmResponse {
    fileId;
    status;
    originalName;
    fileSize;
    contentType;
    virusScanStatus;
    uploadedAt;
    message;
}
exports.FileUploadConfirmResponse = FileUploadConfirmResponse;
class FileInfoResponse {
    id;
    originalName;
    storedName;
    objectKey;
    contentType;
    fileSize;
    status;
    virusScanStatus;
    uploadedAt;
}
exports.FileInfoResponse = FileInfoResponse;
class PresignedUrlResponse {
    url;
    expiresIn;
}
exports.PresignedUrlResponse = PresignedUrlResponse;
class FileBatchInfoRequest {
    fileIds;
}
exports.FileBatchInfoRequest = FileBatchInfoRequest;
class FileBatchInfoResponse {
    files;
    total;
    requestedBy;
    timestamp;
}
exports.FileBatchInfoResponse = FileBatchInfoResponse;
//# sourceMappingURL=file.dto.js.map