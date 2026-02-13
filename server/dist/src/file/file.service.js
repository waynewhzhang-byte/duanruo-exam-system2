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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = exports.MINIO_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const Minio = __importStar(require("minio"));
const uuid_1 = require("uuid");
const file_validator_1 = require("./file-validator");
exports.MINIO_CLIENT = 'MINIO_CLIENT';
let FileService = FileService_1 = class FileService {
    minioClient;
    configService;
    prisma;
    logger = new common_1.Logger(FileService_1.name);
    constructor(minioClient, configService, prisma) {
        this.minioClient = minioClient;
        this.configService = configService;
        this.prisma = prisma;
    }
    getTenantBucketName(tenantCode) {
        const sanitizedCode = tenantCode.toLowerCase().replace(/_/g, '-');
        return `tenant-${sanitizedCode}-files`;
    }
    async ensureTenantBucket(tenantCode) {
        const bucketName = this.getTenantBucketName(tenantCode);
        try {
            const exists = await this.minioClient.bucketExists(bucketName);
            if (!exists) {
                this.logger.warn(`Tenant bucket does not exist: ${bucketName}, creating...`);
                await this.minioClient.makeBucket(bucketName, 'us-east-1');
                this.logger.log(`Created MinIO bucket: ${bucketName}`);
            }
            return bucketName;
        }
        catch (error) {
            this.logger.error(`Failed to ensure tenant bucket ${bucketName}: ${error instanceof Error ? error.message : String(error)}`);
            throw new common_1.BadRequestException(`Storage bucket not available for tenant: ${tenantCode}`);
        }
    }
    async generateUploadUrl(tenantId, userId, req) {
        const { fileName, contentType, fieldKey, applicationId } = req;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { code: true },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant not found');
        }
        const bucketName = await this.ensureTenantBucket(tenant.code);
        const nameValid = file_validator_1.FileValidator.validateFileName(fileName);
        if (!nameValid.valid)
            throw new common_1.BadRequestException(nameValid.errorMessage);
        const extValid = file_validator_1.FileValidator.validateFileExtension(fileName);
        if (!extValid.valid)
            throw new common_1.BadRequestException(extValid.errorMessage);
        const typeValid = file_validator_1.FileValidator.validateContentType(contentType, fileName);
        if (!typeValid.valid)
            throw new common_1.BadRequestException(typeValid.errorMessage);
        const fileId = (0, uuid_1.v4)();
        const extension = fileName.split('.').pop();
        const storedName = `${fileId}${extension ? '.' + extension : ''}`;
        const objectKey = `uploads/${userId}/${fieldKey || 'general'}/${storedName}`;
        await this.prisma.client.fileRecord.create({
            data: {
                id: fileId,
                originalName: fileName,
                storedName: storedName,
                objectKey: objectKey,
                contentType: contentType,
                fieldKey: fieldKey,
                applicationId: applicationId,
                uploadedBy: userId,
                status: 'UPLOADING',
            },
        });
        const expiresIn = parseInt(this.configService.get('MINIO_PRESIGN_EXPIRES', '3600'));
        const uploadUrl = await this.minioClient.presignedPutObject(bucketName, objectKey, expiresIn);
        return {
            fileId,
            uploadUrl,
            fileKey: objectKey,
            fileName,
            contentType,
            fieldKey: fieldKey || '',
            expiresIn,
        };
    }
    async confirmUpload(tenantId, fileId, fileSize) {
        const file = await this.prisma.client.fileRecord.findUnique({
            where: { id: fileId },
        });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        if (file.status !== 'UPLOADING')
            throw new common_1.BadRequestException('File is not in UPLOADING state');
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { code: true },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant not found');
        }
        const bucketName = this.getTenantBucketName(tenant.code);
        try {
            await this.minioClient.statObject(bucketName, file.objectKey);
        }
        catch {
            throw new common_1.BadRequestException('File not found in storage');
        }
        const sizeValid = file_validator_1.FileValidator.validateFileSize(fileSize);
        if (!sizeValid.valid) {
            await this.minioClient.removeObject(bucketName, file.objectKey);
            await this.prisma.client.fileRecord.update({
                where: { id: fileId },
                data: { status: 'DELETED' },
            });
            throw new common_1.BadRequestException(sizeValid.errorMessage);
        }
        return await this.prisma.client.fileRecord.update({
            where: { id: fileId },
            data: {
                fileSize: BigInt(fileSize),
                status: 'UPLOADED',
            },
        });
    }
    async getDownloadUrl(tenantId, fileId) {
        const file = await this.prisma.client.fileRecord.findUnique({
            where: { id: fileId },
        });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        if (file.status === 'DELETED')
            throw new common_1.BadRequestException('File has been deleted');
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { code: true },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant not found');
        }
        const bucketName = this.getTenantBucketName(tenant.code);
        const expiresIn = 1800;
        const url = await this.minioClient.presignedGetObject(bucketName, file.objectKey, expiresIn);
        await this.prisma.client.fileRecord.update({
            where: { id: fileId },
            data: {
                accessCount: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        });
        return { url, expiresIn };
    }
    async getBatchFileInfo(fileIds) {
        const files = await this.prisma.client.fileRecord.findMany({
            where: { id: { in: fileIds } },
        });
        return {
            files: files.map((f) => ({
                id: f.id,
                originalName: f.originalName,
                storedName: f.storedName,
                objectKey: f.objectKey,
                contentType: f.contentType || '',
                fileSize: Number(f.fileSize || 0),
                status: f.status,
                virusScanStatus: f.virusScanStatus,
                uploadedAt: f.createdAt,
            })),
            total: files.length,
            requestedBy: 'SYSTEM',
            timestamp: new Date(),
        };
    }
    async findById(id) {
        return this.prisma.client.fileRecord.findUnique({ where: { id } });
    }
};
exports.FileService = FileService;
exports.FileService = FileService = FileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.MINIO_CLIENT)),
    __metadata("design:paramtypes", [Minio.Client, config_1.ConfigService,
        prisma_service_1.PrismaService])
], FileService);
//# sourceMappingURL=file.service.js.map