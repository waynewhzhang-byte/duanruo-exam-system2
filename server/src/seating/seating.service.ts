import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Application } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AllocateSeatsRequest, SeatAssignmentDetail } from './dto/seating.dto';
import { v4 as uuidv4 } from 'uuid';

interface SeatAssignmentData {
  id: string;
  examId: string;
  positionId: string;
  applicationId: string;
  venueId: string;
  roomId: string;
  seatNo: number;
  seatLabel: string;
  batchId: string;
  createdAt: Date;
}

@Injectable()
export class SeatingService {
  private readonly logger = new Logger(SeatingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  async allocate(
    examId: string,
    request: AllocateSeatsRequest,
    userId: string,
  ) {
    const { strategy } = request;

    return await this.client.$transaction(async (tx) => {
      // 1) Verify exam status
      const exam = await tx.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) throw new NotFoundException('Exam not found');
      // In original logic, exam must be CLOSED.
      // if (exam.status !== 'CLOSED') throw new BadRequestException('Exam must be CLOSED to allocate seats');

      // 2) Get venues and rooms
      const venues = await tx.venue.findMany({
        where: { examId },
        include: { rooms: true },
      });

      if (venues.length === 0)
        throw new BadRequestException('No venues configured for exam');

      // 3) Get eligible applications
      // For now, let's just get PAID applications for feeRequired exams, or APPROVED for others
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
        throw new BadRequestException(
          'No eligible applications for allocation',
        );

      // 4) Delete old assignments
      await tx.seatAssignment.deleteMany({
        where: { examId },
      });

      // 5) Perform allocation logic (Simplified version of POSITION_FIRST_SUBMITTED_AT)
      const batchId = uuidv4();
      const assignments: SeatAssignmentData[] = [];

      // Group by position
      const byPosition = new Map<string, Application[]>();
      for (const app of applications) {
        if (!byPosition.has(app.positionId)) byPosition.set(app.positionId, []);
        byPosition.get(app.positionId)!.push(app);
      }

      // Track capacity
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
        // Sort by submittedAt if available
        apps.sort(
          (a, b) =>
            (a.submittedAt ?? a.createdAt).getTime() -
            (b.submittedAt ?? b.createdAt).getTime(),
        );

        for (const app of apps) {
          let assigned = false;
          for (const vState of venueRoomStates) {
            for (const rState of vState.rooms) {
              if (rState.assignedCount < rState.capacity) {
                rState.assignedCount++;
                const seatNo = rState.assignedCount;
                const seatLabel = `${vState.name}--${rState.code}--${seatNo}`;

                assignments.push({
                  id: uuidv4(),
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
            if (assigned) break;
          }
        }
      }

      // 6) Save assignments
      if (assignments.length > 0) {
        await tx.seatAssignment.createMany({
          data: assignments,
        });
      }

      // 7) ✅ 更新准考证的座位信息
      this.logger.log('Updating tickets with seat assignments...');
      let ticketsUpdated = 0;

      for (const assignment of assignments) {
        // 找到对应的考场和考室信息
        const venue = venueRoomStates.find((v) => v.id === assignment.venueId);
        const room = venue?.rooms.find((r) => r.id === assignment.roomId);

        if (venue && room) {
          // 查找该报名的准考证
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

      // 8) Create allocation batch record
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

  async listAssignments(examId: string): Promise<SeatAssignmentDetail[]> {
    const assignments = await this.client.seatAssignment.findMany({
      where: { examId },
      orderBy: { seatLabel: 'asc' },
    });

    // We would typically join with other tables here, but for simplicity we return what we have
    // Real implementation would join candidate info from public schema
    return assignments.map((a) => ({
      id: a.id,
      applicationId: a.applicationId,
      candidateName: 'Candidate', // Placeholder
      positionTitle: 'Position', // Placeholder
      venueName: 'Venue', // Placeholder
      roomName: 'Room', // Placeholder
      roomCode: '',
      seatNo: a.seatNo,
      seatNumber: a.seatLabel || String(a.seatNo),
      applicationStatus: '',
      assignedAt: a.createdAt,
    }));
  }
}
