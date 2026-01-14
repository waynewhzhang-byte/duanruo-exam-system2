import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketResponse } from './dto/ticket.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    const ticketNo = `T-${Date.now()}-${applicationId.substring(0, 8)}`;
    const ticketNumber = `TN-${Date.now()}`;

    // Get user details (mocking for now, would typically come from User service or join)
    // In a real multi-tenant scenario, candidates are in the public schema
    // and application data is in the tenant schema.

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

  /**
   * 批量生成准考证（管理员操作）
   * 为考试的所有已支付报名生成准考证
   */
  async batchGenerateForExam(examId: string): Promise<{
    totalGenerated: number;
    alreadyExisted: number;
    failed: number;
    ticketNos: string[];
  }> {
    this.logger.log(`Batch generating tickets for exam: ${examId}`);

    // 1. 获取考试信息
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
      include: { positions: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // 2. 获取所有符合条件的报名
    // 收费考试：PAID 状态
    // 免费考试：APPROVED 状态
    const eligibleStatus = exam.feeRequired ? ['PAID'] : ['APPROVED'];

    const applications = await this.client.application.findMany({
      where: {
        examId,
        status: { in: eligibleStatus },
      },
      include: {
        exam: true,
        position: true,
      },
    });

    this.logger.log(
      `Found ${applications.length} eligible applications for ticket generation`,
    );

    let totalGenerated = 0;
    let alreadyExisted = 0;
    let failed = 0;
    const ticketNos: string[] = [];

    for (const app of applications) {
      try {
        // 检查是否已经有准考证
        const existing = await this.client.ticket.findFirst({
          where: { applicationId: app.id },
        });

        if (existing) {
          this.logger.log(`Ticket already exists for application: ${app.id}`);
          alreadyExisted++;
          ticketNos.push(existing.ticketNo);
          continue;
        }

        // 生成准考证
        const ticketNo = `T-${Date.now()}-${app.id.substring(0, 8)}`;
        const ticketNumber = `TN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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
            // 座位信息将在座位分配后更新
          },
        });

        // 更新报名状态
        await this.client.application.update({
          where: { id: app.id },
          data: { status: 'TICKET_ISSUED' },
        });

        totalGenerated++;
        ticketNos.push(ticketNo);

        this.logger.log(`Generated ticket: ${ticketNo} for application: ${app.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to generate ticket for application ${app.id}: ${error.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Batch generation completed: ${totalGenerated} generated, ${alreadyExisted} existed, ${failed} failed`,
    );

    return {
      totalGenerated,
      alreadyExisted,
      failed,
      ticketNos,
    };
  }
}
