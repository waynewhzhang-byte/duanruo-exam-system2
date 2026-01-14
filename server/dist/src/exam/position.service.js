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
exports.PositionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PositionService = class PositionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async findByExamId(examId) {
        const positions = await this.client.position.findMany({
            where: { examId },
            include: { subjects: { orderBy: { ordering: 'asc' } } },
        });
        return positions.map((p) => this.mapToResponse(p));
    }
    async create(request) {
        const exam = await this.client.exam.findUnique({
            where: { id: request.examId },
        });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const existing = await this.client.position.findFirst({
            where: { examId: request.examId, code: request.code },
        });
        if (existing)
            throw new common_1.BadRequestException('Position code already exists for this exam');
        const position = await this.client.position.create({
            data: {
                examId: request.examId,
                code: request.code,
                title: request.title,
                description: request.description,
                requirements: request.requirements,
                quota: request.quota,
                subjects: {
                    create: request.subjects?.map((s) => ({
                        name: s.name,
                        durationMinutes: s.durationMinutes,
                        type: s.type,
                        maxScore: s.maxScore,
                        passingScore: s.passingScore,
                        weight: s.weight ?? 1.0,
                        ordering: s.ordering ?? 0,
                    })) || [],
                },
            },
            include: { subjects: true },
        });
        return this.mapToResponse(position);
    }
    async delete(id) {
        const position = await this.client.position.findUnique({ where: { id } });
        if (!position)
            throw new common_1.NotFoundException('Position not found');
        const hasApps = await this.client.application.findFirst({
            where: { positionId: id },
        });
        if (hasApps)
            throw new common_1.BadRequestException('Cannot delete position with existing applications');
        await this.client.position.delete({ where: { id } });
    }
    mapToResponse(position) {
        return {
            id: position.id,
            examId: position.examId,
            code: position.code,
            title: position.title,
            description: position.description || undefined,
            requirements: position.requirements || undefined,
            quota: position.quota || undefined,
            subjects: position.subjects?.map((s) => ({
                id: s.id,
                name: s.name,
                durationMinutes: s.durationMinutes,
                type: s.type,
                maxScore: s.maxScore ? Number(s.maxScore) : undefined,
                passingScore: s.passingScore ? Number(s.passingScore) : undefined,
                weight: Number(s.weight),
                ordering: s.ordering,
                createdAt: s.createdAt,
            })),
            createdAt: position.createdAt,
        };
    }
};
exports.PositionService = PositionService;
exports.PositionService = PositionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PositionService);
//# sourceMappingURL=position.service.js.map