import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Application } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AllocateSeatsRequest,
  SeatAssignmentDetail,
  SEAT_MAP_CELL_STATUSES,
} from './dto/seating.dto';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationStatus } from '../common/enums';

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
        ? [ApplicationStatus.PAID, ApplicationStatus.TICKET_ISSUED]
        : [
            ApplicationStatus.APPROVED,
            ApplicationStatus.PAID,
            ApplicationStatus.TICKET_ISSUED,
          ];
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

    if (assignments.length === 0) return [];

    // Collect related IDs
    const applicationIds = assignments.map((a) => a.applicationId);
    const venueIds = [...new Set(assignments.map((a) => a.venueId))];
    const roomIds = [
      ...new Set(assignments.map((a) => a.roomId).filter(Boolean)),
    ] as string[];

    // Fetch related data from tenant schema
    const [applications, venues, rooms] = await Promise.all([
      this.client.application.findMany({
        where: { id: { in: applicationIds } },
        select: { id: true, candidateId: true, positionId: true, status: true },
      }),
      this.client.venue.findMany({
        where: { id: { in: venueIds } },
        select: { id: true, name: true },
      }),
      roomIds.length > 0
        ? this.client.room.findMany({
            where: { id: { in: roomIds } },
            select: { id: true, name: true, code: true },
          })
        : ([] as { id: string; name: string; code: string }[]),
    ]);

    // Fetch position titles
    const positionIds = [...new Set(applications.map((a) => a.positionId))];
    const positions =
      positionIds.length > 0
        ? await this.client.position.findMany({
            where: { id: { in: positionIds } },
            select: { id: true, title: true },
          })
        : [];

    // Fetch candidate names from public schema
    const candidateIds = [...new Set(applications.map((a) => a.candidateId))];
    const users =
      candidateIds.length > 0
        ? await this.prisma.publicClient.user.findMany({
            where: { id: { in: candidateIds } },
            select: { id: true, fullName: true },
          })
        : [];

    // Build lookup maps
    const appMap = new Map(applications.map((a) => [a.id, a]));
    const venueMap = new Map(venues.map((v) => [v.id, v]));
    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const posMap = new Map(positions.map((p) => [p.id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return assignments.map((a) => {
      const app = appMap.get(a.applicationId);
      const venue = venueMap.get(a.venueId);
      const room = a.roomId ? roomMap.get(a.roomId) : undefined;
      const pos = app ? posMap.get(app.positionId) : undefined;

      return {
        id: a.id,
        applicationId: a.applicationId,
        candidateName: app
          ? (userMap.get(app.candidateId)?.fullName ?? 'Unknown')
          : 'Unknown',
        positionTitle: pos?.title ?? 'Unknown',
        venueName: venue?.name ?? 'Unknown',
        roomName: room?.name ?? '',
        roomCode: room?.code ?? '',
        seatNo: a.seatNo,
        seatNumber: a.seatLabel || String(a.seatNo),
        applicationStatus: app?.status ?? '',
        assignedAt: a.createdAt,
      };
    });
  }

  /**
   * List all venues
   */
  async listVenues(examId?: string) {
    const where = examId ? { examId } : {};
    const venues = await this.client.venue.findMany({
      where,
      include: {
        rooms: {
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return venues.map((v) => ({
      id: v.id,
      name: v.name,
      capacity: v.capacity,
      examId: v.examId,
      rooms: v.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        capacity: r.capacity,
        floor: r.floor,
      })),
    }));
  }

  /**
   * Get a single venue by ID
   */
  async getVenue(id: string) {
    const venue = await this.client.venue.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue not found: ${id}`);
    }

    return {
      id: venue.id,
      name: venue.name,
      capacity: venue.capacity,
      examId: venue.examId,
      seatMapJson: venue.seatMapJson,
      rooms: venue.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        capacity: r.capacity,
        floor: r.floor,
      })),
    };
  }

  /** Grid seat map JSON shape used by web SeatMapEditor */
  async createSeatMapGrid(venueId: string, rows: number, columns: number) {
    if (
      !Number.isFinite(rows) ||
      !Number.isFinite(columns) ||
      rows < 1 ||
      rows > 50 ||
      columns < 1 ||
      columns > 50
    ) {
      throw new BadRequestException('rows 与 columns 须在 1–50 之间');
    }

    const venue = await this.client.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) {
      throw new NotFoundException(`Venue not found: ${venueId}`);
    }

    const seats: Array<{
      row: number;
      col: number;
      status: string;
      label?: string;
    }> = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= columns; c++) {
        seats.push({ row: r, col: c, status: 'AVAILABLE' });
      }
    }

    const data = { rows, columns, seats };

    await this.client.venue.update({
      where: { id: venueId },
      data: { seatMapJson: data as object },
    });

    return data;
  }

  private parseSeatMapJson(raw: unknown) {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('考场尚未创建座位地图');
    }
    const map = raw as {
      rows: number;
      columns: number;
      seats: Array<{
        row: number;
        col: number;
        status: string;
        label?: string;
      }>;
    };
    if (
      !Array.isArray(map.seats) ||
      typeof map.rows !== 'number' ||
      typeof map.columns !== 'number'
    ) {
      throw new BadRequestException('座位地图数据格式无效');
    }
    return map;
  }

  async updateSeatMapSeatStatus(
    venueId: string,
    row: number,
    col: number,
    status: string,
  ) {
    const allowed = new Set<string>(SEAT_MAP_CELL_STATUSES);
    if (!allowed.has(status)) {
      throw new BadRequestException(`无效的座位状态: ${status}`);
    }

    const venue = await this.client.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) {
      throw new NotFoundException(`Venue not found: ${venueId}`);
    }

    const map = this.parseSeatMapJson(venue.seatMapJson);
    const idx = map.seats.findIndex((s) => s.row === row && s.col === col);
    if (idx === -1) {
      throw new BadRequestException('座位不存在');
    }
    map.seats[idx] = { ...map.seats[idx], status };

    await this.client.venue.update({
      where: { id: venueId },
      data: { seatMapJson: map as object },
    });

    return map;
  }

  async updateSeatMapSeatLabel(
    venueId: string,
    row: number,
    col: number,
    label: string,
  ) {
    const venue = await this.client.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue) {
      throw new NotFoundException(`Venue not found: ${venueId}`);
    }

    const map = this.parseSeatMapJson(venue.seatMapJson);
    const idx = map.seats.findIndex((s) => s.row === row && s.col === col);
    if (idx === -1) {
      throw new BadRequestException('座位不存在');
    }
    map.seats[idx] = { ...map.seats[idx], label };

    await this.client.venue.update({
      where: { id: venueId },
      data: { seatMapJson: map as object },
    });

    return map;
  }

  /**
   * Create a new venue
   */
  async createVenue(data: {
    name: string;
    code?: string;
    capacity: number;
    examId: string;
    rooms?: Array<{
      name: string;
      code: string;
      capacity: number;
      floor?: number;
    }>;
  }) {
    const { name, capacity, examId, rooms } = data;

    // Verify exam exists
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found: ${examId}`);
    }

    // Create venue with rooms
    const venue = await this.client.venue.create({
      data: {
        name,
        capacity,
        examId,
        rooms: rooms
          ? {
              create: rooms.map((r) => ({
                name: r.name,
                code: r.code,
                capacity: r.capacity,
                floor: r.floor,
              })),
            }
          : undefined,
      },
      include: {
        rooms: true,
      },
    });

    return {
      id: venue.id,
      name: venue.name,
      capacity: venue.capacity,
      examId: venue.examId,
      rooms: venue.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        capacity: r.capacity,
        floor: r.floor,
      })),
    };
  }

  async updateVenue(
    venueId: string,
    data: { name?: string; capacity?: number },
  ) {
    const existing = await this.client.venue.findUnique({
      where: { id: venueId },
    });
    if (!existing) {
      throw new NotFoundException(`Venue not found: ${venueId}`);
    }
    const venue = await this.client.venue.update({
      where: { id: venueId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      },
      include: { rooms: { orderBy: { code: 'asc' } } },
    });
    return {
      id: venue.id,
      name: venue.name,
      capacity: venue.capacity,
      examId: venue.examId,
      rooms: venue.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        capacity: r.capacity,
        floor: r.floor,
      })),
    };
  }

  async deleteVenue(venueId: string) {
    const n = await this.client.seatAssignment.count({
      where: { venueId },
    });
    if (n > 0) {
      throw new BadRequestException('无法删除已有座位分配的考场，请先取消分配');
    }
    await this.client.room.deleteMany({ where: { venueId } });
    await this.client.venue.delete({ where: { id: venueId } });
  }

  /**
   * Manually assign a seat to an application
   */
  async assignSeat(
    applicationId: string,
    venueId: string,
    seatNo: number,
    roomId?: string,
  ) {
    const application = await this.client.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const venue = await this.client.venue.findUnique({
      where: { id: venueId },
      include: { rooms: true },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const actualRoomId = roomId || venue.rooms[0]?.id;
    if (!actualRoomId) {
      throw new BadRequestException('No room available in this venue');
    }

    const seatLabel = `${venue.name}--${actualRoomId}--${seatNo}`;

    const assignment = await this.client.seatAssignment.upsert({
      where: { applicationId },
      create: {
        id: uuidv4(),
        examId: application.examId,
        positionId: application.positionId,
        applicationId,
        venueId,
        roomId: actualRoomId,
        seatNo,
        seatLabel,
      },
      update: {
        venueId,
        roomId: actualRoomId,
        seatNo,
        seatLabel,
      },
    });

    return assignment;
  }

  /**
   * List rooms for a venue
   */
  async listRooms(venueId: string) {
    const rooms = await this.client.room.findMany({
      where: { venueId },
      orderBy: { code: 'asc' },
    });

    return rooms.map((r) => ({
      roomId: r.id,
      venueId: r.venueId,
      name: r.name,
      code: r.code,
      capacity: r.capacity,
      floor: r.floor,
      description: null,
    }));
  }

  /**
   * Create a room
   */
  async createRoom(
    venueId: string,
    data: {
      name: string;
      code: string;
      capacity: number;
      floor?: number;
      description?: string;
    },
  ) {
    const venue = await this.client.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue not found: ${venueId}`);
    }

    const room = await this.client.room.create({
      data: {
        venueId,
        name: data.name,
        code: data.code,
        capacity: data.capacity,
        floor: data.floor,
      },
    });

    return {
      roomId: room.id,
      venueId: room.venueId,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      floor: room.floor,
      description: null,
    };
  }

  /**
   * Update a room
   */
  async updateRoom(
    roomId: string,
    data: {
      name?: string;
      code?: string;
      capacity?: number;
      floor?: number;
      description?: string;
    },
  ) {
    const room = await this.client.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room not found: ${roomId}`);
    }

    const updated = await this.client.room.update({
      where: { id: roomId },
      data: {
        name: data.name,
        code: data.code,
        capacity: data.capacity,
        floor: data.floor,
      },
    });

    return {
      roomId: updated.id,
      venueId: updated.venueId,
      name: updated.name,
      code: updated.code,
      capacity: updated.capacity,
      floor: updated.floor,
      description: null,
    };
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: string) {
    const room = await this.client.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room not found: ${roomId}`);
    }

    await this.client.room.delete({
      where: { id: roomId },
    });
  }
}
