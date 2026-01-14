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
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamService = class ExamService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async findAll() {
        const exams = await this.client.exam.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return exams.map((e) => this.mapToResponse(e));
    }
    async findById(id) {
        const exam = await this.client.exam.findUnique({
            where: { id },
        });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        return this.mapToResponse(exam);
    }
    async findByCode(code) {
        const exam = await this.client.exam.findUnique({
            where: { code },
        });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        return this.mapToResponse(exam);
    }
    async create(request, userId) {
        const existing = await this.client.exam.findUnique({
            where: { code: request.code },
        });
        if (existing)
            throw new common_1.BadRequestException('Exam code already exists');
        const exam = await this.client.exam.create({
            data: {
                code: request.code,
                title: request.title,
                description: request.description,
                announcement: request.announcement,
                registrationStart: request.registrationStart
                    ? new Date(request.registrationStart)
                    : null,
                registrationEnd: request.registrationEnd
                    ? new Date(request.registrationEnd)
                    : null,
                examStart: request.examStart ? new Date(request.examStart) : null,
                examEnd: request.examEnd ? new Date(request.examEnd) : null,
                feeRequired: request.feeRequired ?? false,
                feeAmount: request.feeAmount,
                createdBy: userId,
                status: 'DRAFT',
            },
        });
        return this.mapToResponse(exam);
    }
    async update(id, request) {
        const exam = await this.client.exam.findUnique({ where: { id } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const updated = await this.client.exam.update({
            where: { id },
            data: {
                title: request.title,
                description: request.description,
                announcement: request.announcement,
                registrationStart: request.registrationStart
                    ? new Date(request.registrationStart)
                    : null,
                registrationEnd: request.registrationEnd
                    ? new Date(request.registrationEnd)
                    : null,
                examStart: request.examStart ? new Date(request.examStart) : null,
                examEnd: request.examEnd ? new Date(request.examEnd) : null,
                feeRequired: request.feeRequired,
                feeAmount: request.feeAmount,
                status: request.status,
            },
        });
        return this.mapToResponse(updated);
    }
    async delete(id) {
        const exam = await this.client.exam.findUnique({ where: { id } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const hasApps = await this.client.application.findFirst({
            where: { examId: id },
        });
        if (hasApps)
            throw new common_1.BadRequestException('Cannot delete exam with existing applications');
        await this.client.exam.delete({ where: { id } });
    }
    async updateStatus(id, status) {
        const exam = await this.client.exam.findUnique({ where: { id } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const updated = await this.client.exam.update({
            where: { id },
            data: { status },
        });
        return this.mapToResponse(updated);
    }
    mapToResponse(exam) {
        return {
            id: exam.id,
            code: exam.code,
            title: exam.title,
            description: exam.description || undefined,
            announcement: exam.announcement || undefined,
            registrationStart: exam.registrationStart || undefined,
            registrationEnd: exam.registrationEnd || undefined,
            examStart: exam.examStart || undefined,
            examEnd: exam.examEnd || undefined,
            feeRequired: exam.feeRequired,
            feeAmount: exam.feeAmount ? Number(exam.feeAmount) : undefined,
            status: exam.status,
            createdBy: exam.createdBy || undefined,
            createdAt: exam.createdAt,
            updatedAt: exam.updatedAt,
        };
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamService);
//# sourceMappingURL=exam.service.js.map