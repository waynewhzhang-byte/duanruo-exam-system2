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
exports.ApplicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ApplicationService = class ApplicationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async submit(candidateId, request) {
        const exam = await this.client.exam.findUnique({
            where: { id: request.examId },
        });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const now = new Date();
        if (exam.registrationStart && now < exam.registrationStart) {
            throw new common_1.BadRequestException('Registration has not started yet');
        }
        if (exam.registrationEnd && now > exam.registrationEnd) {
            throw new common_1.BadRequestException('Registration has closed');
        }
        const application = await this.client.application.upsert({
            where: {
                examId_candidateId: {
                    examId: request.examId,
                    candidateId: candidateId,
                },
            },
            update: {
                positionId: request.positionId,
                payload: request.payload,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
            create: {
                candidateId: candidateId,
                examId: request.examId,
                positionId: request.positionId,
                payload: request.payload,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
        });
        if (request.attachments && request.attachments.length > 0) {
            for (const attachment of request.attachments) {
                await this.client.fileRecord.update({
                    where: { id: attachment.fileId },
                    data: {
                        applicationId: application.id,
                        status: 'AVAILABLE',
                        fieldKey: attachment.fieldKey,
                    },
                });
            }
        }
        return this.mapToResponse(application);
    }
    async saveDraft(candidateId, request) {
        const application = await this.client.application.upsert({
            where: {
                examId_candidateId: {
                    examId: request.examId,
                    candidateId: candidateId,
                },
            },
            update: {
                positionId: request.positionId,
                payload: request.payload,
                status: 'DRAFT',
            },
            create: {
                candidateId: candidateId,
                examId: request.examId,
                positionId: request.positionId,
                payload: request.payload,
                status: 'DRAFT',
            },
        });
        if (request.attachments && request.attachments.length > 0) {
            for (const attachment of request.attachments) {
                await this.client.fileRecord.update({
                    where: { id: attachment.fileId },
                    data: {
                        applicationId: application.id,
                        status: 'AVAILABLE',
                        fieldKey: attachment.fieldKey,
                    },
                });
            }
        }
        return this.mapToResponse(application);
    }
    async listMyEnriched(candidateId) {
        const apps = await this.client.application.findMany({
            where: { candidateId, status: { not: 'DRAFT' } },
            include: {
                exam: true,
                position: true,
                attachments: true,
            },
        });
        return apps.map((app) => ({
            ...this.mapToResponse(app),
            examTitle: app.exam.title,
            positionTitle: app.position.title,
            feeRequired: app.exam.feeRequired,
            feeAmount: app.exam.feeAmount ? Number(app.exam.feeAmount) : 0,
        }));
    }
    async listMyDrafts(candidateId) {
        const apps = await this.client.application.findMany({
            where: { candidateId, status: 'DRAFT' },
            include: {
                exam: true,
                position: true,
                attachments: true,
            },
        });
        return apps.map((app) => ({
            ...this.mapToResponse(app),
            examTitle: app.exam.title,
            positionTitle: app.position.title,
            feeRequired: app.exam.feeRequired,
            feeAmount: app.exam.feeAmount ? Number(app.exam.feeAmount) : 0,
        }));
    }
    async findById(id) {
        const app = await this.client.application.findUnique({
            where: { id },
            include: { attachments: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        return this.mapToResponse(app);
    }
    mapToResponse(app) {
        return {
            id: app.id,
            examId: app.examId,
            positionId: app.positionId,
            candidateId: app.candidateId,
            formVersion: app.formVersion,
            status: app.status,
            submittedAt: app.submittedAt || undefined,
            attachments: app.attachments?.map((a) => ({
                fileId: a.id,
                fieldKey: a.fieldKey || '',
            })),
        };
    }
};
exports.ApplicationService = ApplicationService;
exports.ApplicationService = ApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationService);
//# sourceMappingURL=application.service.js.map