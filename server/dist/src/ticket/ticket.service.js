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
var TicketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let TicketService = TicketService_1 = class TicketService {
    prisma;
    logger = new common_1.Logger(TicketService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async generate(applicationId) {
        const app = await this.client.application.findUnique({
            where: { id: applicationId },
            include: {
                exam: true,
                position: true,
            },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const ticketNo = `T-${Date.now()}-${applicationId.substring(0, 8)}`;
        const ticketNumber = `TN-${Date.now()}`;
        const ticket = await this.client.ticket.create({
            data: {
                id: (0, uuid_1.v4)(),
                applicationId,
                examId: app.examId,
                positionId: app.positionId,
                candidateId: app.candidateId,
                ticketNo,
                ticketNumber,
                status: 'ACTIVE',
                examTitle: app.exam.title,
                positionTitle: app.position.title,
                examStartTime: app.exam.examStart,
                examEndTime: app.exam.examEnd,
                issuedAt: new Date(),
            },
        });
        return ticket.ticketNo;
    }
    async findByApplicationId(applicationId) {
        const tickets = await this.client.ticket.findMany({
            where: { applicationId },
        });
        return tickets.map((t) => ({
            ...t,
            candidateName: t.candidateName || '',
            candidateIdNumber: t.candidateIdNumber || '',
            examTitle: t.examTitle || '',
            positionTitle: t.positionTitle || '',
            examStartTime: t.examStartTime || new Date(),
            examEndTime: t.examEndTime || new Date(),
            venueName: t.venueName || undefined,
            roomNumber: t.roomNumber || undefined,
            seatNumber: t.seatNumber || undefined,
            qrCode: t.qrCode || undefined,
        }));
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = TicketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketService);
//# sourceMappingURL=ticket.service.js.map