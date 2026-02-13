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
var ReviewService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const review_dto_1 = require("./dto/review.dto");
const uuid_1 = require("uuid");
let ReviewService = ReviewService_1 = class ReviewService {
    prisma;
    logger = new common_1.Logger(ReviewService_1.name);
    LOCK_TTL_MINUTES = 10;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async pullNext(reviewerId, request) {
        const { examId, stage } = request;
        const lockThreshold = new Date();
        lockThreshold.setMinutes(lockThreshold.getMinutes() - this.LOCK_TTL_MINUTES);
        const existingTask = await this.client.reviewTask.findFirst({
            where: {
                assignedTo: reviewerId,
                stage: stage,
                status: 'ASSIGNED',
                lockedAt: { gt: lockThreshold },
            },
        });
        if (existingTask && existingTask.lockedAt) {
            return {
                taskId: existingTask.id,
                applicationId: existingTask.applicationId,
                stage: existingTask.stage,
                lockedUntil: new Date(existingTask.lockedAt.getTime() + this.LOCK_TTL_MINUTES * 60000),
            };
        }
        let targetStatus;
        if (stage === review_dto_1.ReviewStage.PRIMARY) {
            targetStatus = ['PENDING_PRIMARY_REVIEW', 'SUBMITTED'];
        }
        else {
            targetStatus = ['PENDING_SECONDARY_REVIEW', 'PRIMARY_PASSED'];
        }
        const applications = await this.client.application.findMany({
            where: {
                examId: examId,
                status: { in: targetStatus },
            },
            orderBy: { createdAt: 'asc' },
        });
        for (const app of applications) {
            const activeTask = await this.client.reviewTask.findFirst({
                where: {
                    applicationId: app.id,
                    stage: stage,
                    status: 'ASSIGNED',
                    lockedAt: { gt: lockThreshold },
                },
            });
            if (activeTask)
                continue;
            const task = await this.client.reviewTask.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    applicationId: app.id,
                    stage: stage,
                    status: 'ASSIGNED',
                    assignedTo: reviewerId,
                    lockedAt: new Date(),
                    lastHeartbeatAt: new Date(),
                },
            });
            return {
                taskId: task.id,
                applicationId: task.applicationId,
                stage: task.stage,
                lockedUntil: new Date(task.lockedAt.getTime() + this.LOCK_TTL_MINUTES * 60000),
            };
        }
        return null;
    }
    async decide(reviewerId, request) {
        const { taskId, approve, reason, evidenceFileIds } = request;
        const task = await this.client.reviewTask.findUnique({
            where: { id: taskId },
        });
        if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
            throw new common_1.BadRequestException('Task not found or not assigned to you');
        }
        const lockThreshold = new Date();
        lockThreshold.setMinutes(lockThreshold.getMinutes() - this.LOCK_TTL_MINUTES);
        if (!task.lockedAt || task.lockedAt < lockThreshold) {
            throw new common_1.BadRequestException('Task lock expired');
        }
        const app = await this.client.application.findUnique({
            where: { id: task.applicationId },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const fromStatus = app.status;
        let toStatus;
        if (task.stage === 'PRIMARY') {
            toStatus = approve ? 'PRIMARY_PASSED' : 'PRIMARY_REJECTED';
        }
        else {
            toStatus = approve ? 'APPROVED' : 'SECONDARY_REJECTED';
        }
        return await this.client.$transaction(async (tx) => {
            await tx.application.update({
                where: { id: app.id },
                data: { status: toStatus, updatedAt: new Date() },
            });
            const reviewOutcome = approve ? 'APPROVED' : 'REJECTED';
            await tx.review.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    applicationId: app.id,
                    stage: task.stage,
                    reviewerId: reviewerId,
                    decision: reviewOutcome,
                    comment: reason,
                    reviewedAt: new Date(),
                },
            });
            await tx.applicationAuditLog.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    applicationId: app.id,
                    fromStatus: fromStatus,
                    toStatus: toStatus,
                    actor: reviewerId,
                    reason: reason,
                    metadata: evidenceFileIds ? { evidenceFileIds } : undefined,
                },
            });
            await tx.reviewTask.update({
                where: { id: taskId },
                data: { status: 'COMPLETED' },
            });
            if (toStatus === 'PRIMARY_PASSED') {
                await tx.application.update({
                    where: { id: app.id },
                    data: { status: 'PENDING_SECONDARY_REVIEW' },
                });
                await tx.applicationAuditLog.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        applicationId: app.id,
                        fromStatus: 'PRIMARY_PASSED',
                        toStatus: 'PENDING_SECONDARY_REVIEW',
                        actor: 'SYSTEM',
                        reason: 'Auto-enter secondary review',
                    },
                });
            }
            return { applicationId: app.id, fromStatus, toStatus };
        });
    }
    async getByApplicationId(applicationId) {
        const reviews = await this.client.review.findMany({
            where: { applicationId },
            orderBy: { reviewedAt: 'asc' },
        });
        return reviews;
    }
    async heartbeat(taskId, reviewerId) {
        const task = await this.client.reviewTask.findUnique({
            where: { id: taskId },
        });
        if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
            throw new common_1.BadRequestException('Task not found or not assigned to you');
        }
        await this.client.reviewTask.update({
            where: { id: taskId },
            data: { lastHeartbeatAt: new Date(), lockedAt: new Date() },
        });
        return { success: true };
    }
    async release(taskId, reviewerId) {
        const task = await this.client.reviewTask.findUnique({
            where: { id: taskId },
        });
        if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
            throw new common_1.BadRequestException('Task not found or not assigned to you');
        }
        await this.client.reviewTask.update({
            where: { id: taskId },
            data: { status: 'OPEN', assignedTo: null, lockedAt: null },
        });
        return { success: true };
    }
    async getQueue(params) {
        const { examId, stage, status, page, size } = params;
        const skip = page * size;
        const where = { stage };
        if (status) {
            where.status = status;
        }
        where.applicationId = {
            in: (await this.client.application.findMany({
                where: { examId },
                select: { id: true },
            })).map((a) => a.id),
        };
        const [tasks, total] = await Promise.all([
            this.client.reviewTask.findMany({
                where,
                skip,
                take: size,
                orderBy: { createdAt: 'desc' },
            }),
            this.client.reviewTask.count({ where }),
        ]);
        return { content: tasks, total };
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = ReviewService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map