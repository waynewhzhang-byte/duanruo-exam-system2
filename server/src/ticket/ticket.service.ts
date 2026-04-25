import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Ticket as TicketRow } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getErrorMessage } from '../common/utils/error.util';
import { TicketResponse } from './dto/ticket.dto';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';
import { NotificationService } from '../common/notification/notification.service';
import { ApplicationStatus, TicketStatus } from '../common/enums';

function generateSecureTicketNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().split('-')[0].toUpperCase();
  return `T-${timestamp}-${random}`;
}

function generateSecureTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().split('-')[0].toUpperCase();
  return `TN-${timestamp}-${random}`;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  async generate(applicationId: string): Promise<string> {
    const app = await this.client.application.findUnique({
      where: { id: applicationId },
      include: {
        exam: true,
        position: true,
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    const ticketNo = generateSecureTicketNo();
    const ticketNumber = generateSecureTicketNumber();

    const ticket = await this.client.ticket.create({
      data: {
        id: uuidv4(),
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

  async findByApplicationId(applicationId: string): Promise<TicketResponse[]> {
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

  async batchGenerateForExam(examId: string): Promise<{
    totalGenerated: number;
    alreadyExisted: number;
    failed: number;
    ticketNos: string[];
  }> {
    this.logger.log(`Batch generating tickets for exam: ${examId}`);

    const exam = await this.client.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const eligibleStatus = exam.feeRequired
      ? [ApplicationStatus.PAID]
      : [ApplicationStatus.APPROVED];

    const [applications, existingTickets] = await Promise.all([
      this.client.application.findMany({
        where: {
          examId,
          status: { in: eligibleStatus },
        },
        include: {
          exam: true,
          position: true,
        },
      }),
      this.client.ticket.findMany({
        where: { examId },
        select: { applicationId: true, ticketNo: true },
      }),
    ]);

    this.logger.log(
      `Found ${applications.length} eligible applications for ticket generation`,
    );

    const existingTicketMap = new Map(
      existingTickets.map((t) => [t.applicationId, t.ticketNo]),
    );

    const applicationsNeedingTickets = applications.filter(
      (app) => !existingTicketMap.has(app.id),
    );

    const alreadyExisted =
      applications.length - applicationsNeedingTickets.length;
    const existingTicketNos = applications
      .filter((app) => existingTicketMap.has(app.id))
      .map((app) => existingTicketMap.get(app.id)!);

    if (applicationsNeedingTickets.length === 0) {
      this.logger.log('All applications already have tickets');
      return {
        totalGenerated: 0,
        alreadyExisted,
        failed: 0,
        ticketNos: existingTicketNos,
      };
    }

    const ticketsData = applicationsNeedingTickets.map((app) => ({
      id: uuidv4(),
      applicationId: app.id,
      examId: app.examId,
      positionId: app.positionId,
      candidateId: app.candidateId,
      ticketNo: generateSecureTicketNo(),
      ticketNumber: generateSecureTicketNumber(),
      status: 'ACTIVE' as const,
      examTitle: app.exam.title,
      positionTitle: app.position.title,
      examStartTime: app.exam.examStart,
      examEndTime: app.exam.examEnd,
      issuedAt: new Date(),
    }));

    const applicationIdsToUpdate = applicationsNeedingTickets.map(
      (app) => app.id,
    );
    const newTicketNos = ticketsData.map((t) => t.ticketNo);

    let totalGenerated = 0;
    let failed = 0;

    try {
      await this.client.$transaction(async (tx) => {
        await tx.ticket.createMany({
          data: ticketsData,
          skipDuplicates: true,
        });

        await tx.application.updateMany({
          where: { id: { in: applicationIdsToUpdate } },
          data: { status: ApplicationStatus.TICKET_ISSUED },
        });

        totalGenerated = ticketsData.length;
      });

      this.logger.log(
        `Successfully generated ${totalGenerated} tickets in batch`,
      );

      // 异步发送通知 (Async notification)
      this.sendTicketNotifications(ticketsData).catch((err: unknown) =>
        this.logger.error(
          `Failed to send ticket notifications: ${getErrorMessage(err)}`,
        ),
      );
    } catch (error) {
      this.logger.error(
        `Batch ticket generation failed: ${getErrorMessage(error)}`,
      );
      failed = applicationsNeedingTickets.length;

      for (const app of applicationsNeedingTickets) {
        try {
          const ticketNo = generateSecureTicketNo();
          const ticketNumber = generateSecureTicketNumber();

          await this.client.ticket.create({
            data: {
              id: uuidv4(),
              applicationId: app.id,
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

          await this.client.application.update({
            where: { id: app.id },
            data: { status: ApplicationStatus.TICKET_ISSUED },
          });

          totalGenerated++;
          failed--;
          newTicketNos.push(ticketNo);
        } catch (fallbackError) {
          this.logger.error(
            `Failed to generate ticket for ${app.id}: ${getErrorMessage(fallbackError)}`,
          );
        }
      }
    }

    this.logger.log(
      `Batch generation completed: ${totalGenerated} generated, ${alreadyExisted} existed, ${failed} failed`,
    );

    return {
      totalGenerated,
      alreadyExisted,
      failed,
      ticketNos: [...existingTicketNos, ...newTicketNos],
    };
  }

  async findByCurrentUser(): Promise<TicketResponse[]> {
    const tickets = await this.client.ticket.findMany({
      orderBy: { issuedAt: 'desc' },
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

  async generatePdf(ticketId: string): Promise<Buffer> {
    const ticket = await this.client.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const pdfContent = `
=====================================
       准考证 / ADMIT CARD
=====================================

准考证号: ${ticket.ticketNo}
顺序号: ${ticket.ticketNumber}

--------------------------------------
考生信息 / Candidate Info
--------------------------------------
姓名: ${ticket.candidateName || 'N/A'}
证件号: ${ticket.candidateIdNumber || 'N/A'}

--------------------------------------
考试信息 / Exam Info
--------------------------------------
考试名称: ${ticket.examTitle || 'N/A'}
岗位名称: ${ticket.positionTitle || 'N/A'}

考试时间: ${ticket.examStartTime ? new Date(ticket.examStartTime).toLocaleString() : 'N/A'}
          至 ${ticket.examEndTime ? new Date(ticket.examEndTime).toLocaleString() : 'N/A'}

--------------------------------------
考场信息 / Venue Info
--------------------------------------
考场: ${ticket.venueName || 'N/A'}
教室: ${ticket.roomNumber || 'N/A'}
座位号: ${ticket.seatNumber || 'N/A'}

=====================================
Generated at: ${new Date().toISOString()}
=====================================
    `;

    return Buffer.from(pdfContent);
  }

  async batchGenerate(applicationIds: string[]): Promise<{
    totalGenerated: number;
    alreadyExisted: number;
    failed: number;
    ticketNos: string[];
  }> {
    if (applicationIds.length === 0) {
      return { totalGenerated: 0, alreadyExisted: 0, failed: 0, ticketNos: [] };
    }

    const [applications, existingTickets] = await Promise.all([
      this.client.application.findMany({
        where: { id: { in: applicationIds } },
        include: { exam: true, position: true },
      }),
      this.client.ticket.findMany({
        where: { applicationId: { in: applicationIds } },
        select: { applicationId: true, ticketNo: true },
      }),
    ]);

    const existingTicketMap = new Map(
      existingTickets.map((t) => [t.applicationId, t.ticketNo]),
    );

    const applicationsNeedingTickets = applications.filter(
      (app) => !existingTicketMap.has(app.id),
    );

    const alreadyExisted = existingTickets.length;
    const existingTicketNos = existingTickets.map((t) => t.ticketNo);

    const notFoundIds = applicationIds.filter(
      (id) => !applications.find((app) => app.id === id),
    );

    if (applicationsNeedingTickets.length === 0) {
      return {
        totalGenerated: 0,
        alreadyExisted,
        failed: notFoundIds.length,
        ticketNos: existingTicketNos,
      };
    }

    const ticketsData = applicationsNeedingTickets.map((app) => ({
      id: uuidv4(),
      applicationId: app.id,
      examId: app.examId,
      positionId: app.positionId,
      candidateId: app.candidateId,
      ticketNo: generateSecureTicketNo(),
      ticketNumber: generateSecureTicketNumber(),
      status: 'ACTIVE' as const,
      examTitle: app.exam.title,
      positionTitle: app.position.title,
      examStartTime: app.exam.examStart,
      examEndTime: app.exam.examEnd,
      issuedAt: new Date(),
    }));

    const applicationIdsToUpdate = applicationsNeedingTickets.map(
      (app) => app.id,
    );
    const newTicketNos = ticketsData.map((t) => t.ticketNo);

    let totalGenerated = 0;

    try {
      await this.client.$transaction(async (tx) => {
        await tx.ticket.createMany({
          data: ticketsData,
          skipDuplicates: true,
        });

        await tx.application.updateMany({
          where: { id: { in: applicationIdsToUpdate } },
          data: { status: ApplicationStatus.TICKET_ISSUED },
        });

        totalGenerated = ticketsData.length;
      });
    } catch (error) {
      this.logger.error(`Batch generation failed: ${getErrorMessage(error)}`);
    }

    return {
      totalGenerated,
      alreadyExisted,
      failed:
        notFoundIds.length +
        (applicationsNeedingTickets.length - totalGenerated),
      ticketNos: [
        ...existingTicketNos,
        ...newTicketNos.slice(0, totalGenerated),
      ],
    };
  }

  private toClientTicket(t: TicketRow): Record<string, unknown> {
    const statusMap: Record<string, string> = {
      ACTIVE: 'VALID',
      CANCELLED: 'CANCELLED',
      PRINTED: 'USED',
    };
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      applicationId: t.applicationId,
      examId: t.examId,
      candidateId: t.candidateId,
      candidateName: t.candidateName || '',
      candidateIdCard: t.candidateIdNumber || undefined,
      examName: t.examTitle || '',
      examDate: t.examStartTime?.toISOString(),
      venueName: t.venueName || undefined,
      roomNumber: t.roomNumber || undefined,
      seatNumber: t.seatNumber || undefined,
      qrCodeData: t.qrCode || undefined,
      barcodeData: t.barcode || undefined,
      status: statusMap[t.status] ?? 'VALID',
      generatedAt: t.issuedAt.toISOString(),
    };
  }

  async findById(ticketId: string): Promise<Record<string, unknown>> {
    const t = await this.client.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!t) {
      throw new NotFoundException('Ticket not found');
    }
    return this.toClientTicket(t);
  }

  /**
   * Validate ticket at gate (lookup only; does not change state).
   */
  async validateTicket(input: {
    ticketNumber?: string;
    qrCode?: string;
    barcode?: string;
  }): Promise<{
    valid: boolean;
    ticket?: Record<string, unknown>;
    reason?: string;
    validationTime: string;
  }> {
    const validationTime = new Date().toISOString();
    const tn = input.ticketNumber?.trim();
    const qr = input.qrCode?.trim();
    const bc = input.barcode?.trim();

    if (!tn && !qr && !bc) {
      throw new BadRequestException(
        '必须提供 ticketNumber、qrCode 或 barcode 之一',
      );
    }

    let ticket: TicketRow | null = null;

    if (qr) {
      ticket = await this.client.ticket.findFirst({ where: { qrCode: qr } });
    }
    if (!ticket && bc) {
      ticket = await this.client.ticket.findFirst({ where: { barcode: bc } });
    }
    if (!ticket && tn) {
      ticket = await this.client.ticket.findFirst({
        where: {
          OR: [{ ticketNumber: tn }, { ticketNo: tn }],
        },
      });
    }

    if (!ticket) {
      return {
        valid: false,
        reason: '未找到准考证',
        validationTime,
      };
    }

    const mapped = this.toClientTicket(ticket);

    if (ticket.status === 'CANCELLED') {
      return {
        valid: false,
        reason: '准考证已作废',
        ticket: mapped,
        validationTime,
      };
    }

    if (ticket.examEndTime && new Date() > new Date(ticket.examEndTime)) {
      return {
        valid: false,
        reason: '考试已结束',
        ticket: mapped,
        validationTime,
      };
    }

    return {
      valid: true,
      ticket: mapped,
      validationTime,
    };
  }

  /**
   * Verify ticket at gate (sets verifiedAt, status PRINTED).
   */
  async verifyTicket(input: {
    ticketId: string;
    verificationCode?: string;
  }): Promise<{
    verified: boolean;
    ticket?: Record<string, unknown>;
    message?: string;
  }> {
    const ticket = await this.client.ticket.findUnique({
      where: { id: input.ticketId },
    });

    if (!ticket) {
      return { verified: false, message: '准考证不存在' };
    }

    if (ticket.status === 'CANCELLED') {
      return {
        verified: false,
        message: '准考证已作废',
        ticket: this.toClientTicket(ticket),
      };
    }

    if (ticket.verifiedAt) {
      return {
        verified: false,
        message: '该准考证已核销',
        ticket: this.toClientTicket(ticket),
      };
    }

    const updated = await this.client.ticket.update({
      where: { id: input.ticketId },
      data: {
        verifiedAt: new Date(),
        status: TicketStatus.PRINTED,
      },
    });

    return {
      verified: true,
      message: '核销成功',
      ticket: this.toClientTicket(updated),
    };
  }

  async deleteTicketNumberRule(examId: string) {
    await this.client.ticketNumberRule.deleteMany({ where: { examId } });
  }

  async listTicketsForExam(examId: string) {
    const rows = await this.client.ticket.findMany({
      where: { examId },
      orderBy: { issuedAt: 'desc' },
    });
    return rows.map((t) => ({
      id: t.id,
      applicationId: t.applicationId,
      ticketNo: t.ticketNo,
      candidateName: t.candidateName || '',
      positionTitle: t.positionTitle || '',
      venueName: t.venueName || '',
      roomNumber: t.roomNumber || undefined,
      seatNumber: t.seatNumber || undefined,
      status: t.status,
      issuedAt: t.issuedAt.toISOString(),
    }));
  }

  async getTicketNumberRule(examId: string) {
    const row = await this.client.ticketNumberRule.findUnique({
      where: { examId },
    });
    if (!row) {
      return {
        prefix: '',
        dateFormat: 'YYYYMMDD',
        sequenceLength: 4,
        separator: '-',
        includeExamCode: true,
        includePositionCode: true,
        includeExamName: false,
        includePositionName: false,
        checksumType: 'NONE',
      };
    }
    return {
      prefix: row.customPrefix ?? '',
      dateFormat: row.dateFormat,
      sequenceLength: row.sequenceLength,
      separator: row.separator,
      includeExamCode: row.includeExamCode,
      includePositionCode: row.includePositionCode,
      includeExamName: row.includeExamName,
      includePositionName: row.includePositionName,
      checksumType: row.checksumType,
    };
  }

  async upsertTicketNumberRule(
    examId: string,
    body: {
      prefix?: string;
      dateFormat?: string;
      sequenceLength?: number;
      separator?: string;
      includeExamCode?: boolean;
      includePositionCode?: boolean;
      includeExamName?: boolean;
      includePositionName?: boolean;
      checksumType?: string;
    },
  ) {
    const exam = await this.client.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    await this.client.ticketNumberRule.upsert({
      where: { examId },
      create: {
        examId,
        customPrefix: body.prefix ?? '',
        includeExamCode: body.includeExamCode ?? true,
        includeExamName: body.includeExamName ?? false,
        includePositionCode: body.includePositionCode ?? true,
        includePositionName: body.includePositionName ?? false,
        dateFormat: body.dateFormat ?? 'YYYYMMDD',
        sequenceLength: body.sequenceLength ?? 4,
        sequenceStart: 1,
        dailyReset: false,
        checksumType: body.checksumType ?? 'NONE',
        separator: body.separator ?? '-',
      },
      update: {
        customPrefix: body.prefix,
        includeExamCode: body.includeExamCode,
        includeExamName: body.includeExamName,
        includePositionCode: body.includePositionCode,
        includePositionName: body.includePositionName,
        dateFormat: body.dateFormat,
        sequenceLength: body.sequenceLength,
        checksumType: body.checksumType,
        separator: body.separator,
      },
    });
    return this.getTicketNumberRule(examId);
  }

  /**
   * Helper to send notifications for generated tickets
   */
  private async sendTicketNotifications(
    tickets: Array<{
      candidateId: string;
      ticketNo: string;
      examTitle?: string;
    }>,
  ) {
    for (const ticket of tickets) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: ticket.candidateId },
          select: { email: true, fullName: true },
        });

        if (user?.email) {
          await this.notificationService.notifyTicketGenerated(
            user.email,
            user.fullName,
            ticket.examTitle || '考试',
            ticket.ticketNo,
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to send notification for ticket ${ticket.ticketNo}: ${getErrorMessage(err)}`,
        );
      }
    }
  }
}
