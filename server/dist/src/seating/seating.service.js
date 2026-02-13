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
var SeatingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let SeatingService = SeatingService_1 = class SeatingService {
    prisma;
    logger = new common_1.Logger(SeatingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async allocate(examId, request, userId) {
        const { strategy } = request;
        return await this.client.$transaction(async (tx) => {
            const exam = await tx.exam.findUnique({
                where: { id: examId },
            });
            if (!exam)
                throw new common_1.NotFoundException('Exam not found');
            const venues = await tx.venue.findMany({
                where: { examId },
                include: { rooms: true },
            });
            if (venues.length === 0)
                throw new common_1.BadRequestException('No venues configured for exam');
            const eligibleStatus = exam.feeRequired
                ? ['PAID', 'TICKET_ISSUED']
                : ['APPROVED', 'PAID', 'TICKET_ISSUED'];
            const applications = await tx.application.findMany({
                where: {
                    examId,
                    status: { in: eligibleStatus },
                },
                orderBy: { createdAt: 'asc' },
            });
            if (applications.length === 0)
                throw new common_1.BadRequestException('No eligible applications for allocation');
            await tx.seatAssignment.deleteMany({
                where: { examId },
            });
            const batchId = (0, uuid_1.v4)();
            const assignments = [];
            const byPosition = new Map();
            for (const app of applications) {
                if (!byPosition.has(app.positionId))
                    byPosition.set(app.positionId, []);
                byPosition.get(app.positionId).push(app);
            }
            const venueRoomStates = venues.map((v) => ({
                id: v.id,
                name: v.name,
                rooms: v.rooms.map((r) => ({
                    id: r.id,
                    name: r.name,
                    code: r.code,
                    capacity: r.capacity,
                    assignedCount: 0,
                })),
            }));
            for (const [posId, apps] of byPosition.entries()) {
                apps.sort((a, b) => (a.submittedAt ?? a.createdAt).getTime() -
                    (b.submittedAt ?? b.createdAt).getTime());
                for (const app of apps) {
                    let assigned = false;
                    for (const vState of venueRoomStates) {
                        for (const rState of vState.rooms) {
                            if (rState.assignedCount < rState.capacity) {
                                rState.assignedCount++;
                                const seatNo = rState.assignedCount;
                                const seatLabel = `${vState.name}--${rState.code}--${seatNo}`;
                                assignments.push({
                                    id: (0, uuid_1.v4)(),
                                    examId,
                                    positionId: posId,
                                    applicationId: app.id,
                                    venueId: vState.id,
                                    roomId: rState.id,
                                    seatNo,
                                    seatLabel,
                                    batchId,
                                    createdAt: new Date(),
                                });
                                assigned = true;
                                break;
                            }
                        }
                        if (assigned)
                            break;
                    }
                }
            }
            if (assignments.length > 0) {
                await tx.seatAssignment.createMany({
                    data: assignments,
                });
            }
            this.logger.log('Updating tickets with seat assignments...');
            let ticketsUpdated = 0;
            for (const assignment of assignments) {
                const venue = venueRoomStates.find((v) => v.id === assignment.venueId);
                const room = venue?.rooms.find((r) => r.id === assignment.roomId);
                if (venue && room) {
                    const ticket = await tx.ticket.findFirst({
                        where: { applicationId: assignment.applicationId },
                    });
                    if (ticket) {
                        await tx.ticket.update({
                            where: { id: ticket.id },
                            data: {
                                venueName: venue.name,
                                roomNumber: room.code,
                                seatNumber: assignment.seatLabel,
                                updatedAt: new Date(),
                            },
                        });
                        ticketsUpdated++;
                    }
                }
            }
            this.logger.log(`Updated ${ticketsUpdated} tickets with seat info`);
            const batch = await tx.allocationBatch.create({
                data: {
                    id: batchId,
                    examId,
                    strategy,
                    totalCandidates: applications.length,
                    totalAssigned: assignments.length,
                    totalVenues: venues.length,
                    createdBy: userId,
                },
            });
            return {
                batchId: batch.id,
                totalCandidates: applications.length,
                totalAssigned: assignments.length,
                totalVenues: venues.length,
                ticketsUpdated,
            };
        });
    }
    async listAssignments(examId) {
        const assignments = await this.client.seatAssignment.findMany({
            where: { examId },
            orderBy: { seatLabel: 'asc' },
        });
        return assignments.map((a) => ({
            id: a.id,
            applicationId: a.applicationId,
            candidateName: 'Candidate',
            positionTitle: 'Position',
            venueName: 'Venue',
            roomName: 'Room',
            roomCode: '',
            seatNo: a.seatNo,
            seatNumber: a.seatLabel || String(a.seatNo),
            applicationStatus: '',
            assignedAt: a.createdAt,
        }));
    }
};
exports.SeatingService = SeatingService;
exports.SeatingService = SeatingService = SeatingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeatingService);
//# sourceMappingURL=seating.service.js.map