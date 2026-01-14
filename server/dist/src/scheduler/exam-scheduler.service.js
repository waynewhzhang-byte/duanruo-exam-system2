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
var ExamSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const exam_service_1 = require("../exam/exam.service");
const seating_service_1 = require("../seating/seating.service");
let ExamSchedulerService = ExamSchedulerService_1 = class ExamSchedulerService {
    prisma;
    examService;
    seatingService;
    logger = new common_1.Logger(ExamSchedulerService_1.name);
    constructor(prisma, examService, seatingService) {
        this.prisma = prisma;
        this.examService = examService;
        this.seatingService = seatingService;
    }
    async closeExpiredRegistrations() {
        this.logger.debug('[RegistrationClosure] Starting scan...');
        const activeTenants = await this.prisma.client.tenant.findMany({
            where: { status: 'ACTIVE' },
        });
        for (const tenant of activeTenants) {
            try {
                await this.prisma.client.$transaction(async (tx) => {
                    await tx.$executeRawUnsafe(`SET search_path TO "${tenant.schemaName}", public`);
                    const openExams = await tx.exam.findMany({
                        where: { status: 'OPEN' },
                    });
                    const now = new Date();
                    let closedCount = 0;
                    for (const exam of openExams) {
                        if (exam.registrationEnd && exam.registrationEnd < now) {
                            await tx.exam.update({
                                where: { id: exam.id },
                                data: { status: 'CLOSED' },
                            });
                            closedCount++;
                            this.logger.log(`[RegistrationClosure] Closed exam: ${exam.code} in tenant: ${tenant.code}`);
                        }
                    }
                    if (closedCount > 0) {
                        this.logger.log(`[RegistrationClosure] Tenant ${tenant.code}: Closed ${closedCount} exams`);
                    }
                }, { timeout: 30000 });
            }
            catch (error) {
                this.logger.error(`[RegistrationClosure] Error processing tenant ${tenant.code}: ${error.message}`);
            }
        }
    }
    async runAutoSeating() {
        this.logger.debug('[AutoSeating] Starting auto seating scheduler');
        const activeTenants = await this.prisma.client.tenant.findMany({
            where: { status: 'ACTIVE' },
        });
        for (const tenant of activeTenants) {
            try {
                await prisma_service_1.PrismaService.runInTenantContext(tenant.schemaName, async () => {
                    await this.prisma.client.$transaction(async (tx) => {
                        await tx.$executeRawUnsafe(`SET search_path TO "${tenant.schemaName}", public`);
                        const closedExams = await tx.exam.findMany({
                            where: { status: 'CLOSED' },
                        });
                        for (const exam of closedExams) {
                            const existing = await tx.seatAssignment.findFirst({
                                where: { examId: exam.id },
                            });
                            if (!existing) {
                                this.logger.log(`[AutoSeating] Found closed exam ${exam.code} in tenant ${tenant.code} requiring allocation`);
                            }
                        }
                    });
                });
            }
            catch (error) {
                this.logger.error(`[AutoSeating] Error processing tenant ${tenant.code}: ${error.message}`);
            }
        }
    }
};
exports.ExamSchedulerService = ExamSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamSchedulerService.prototype, "closeExpiredRegistrations", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExamSchedulerService.prototype, "runAutoSeating", null);
exports.ExamSchedulerService = ExamSchedulerService = ExamSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        exam_service_1.ExamService,
        seating_service_1.SeatingService])
], ExamSchedulerService);
//# sourceMappingURL=exam-scheduler.service.js.map