import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutoReviewService } from '../review/auto-review.service';
import { Application, FileRecord, Prisma } from '@prisma/client';
import {
  ApplicationSubmitRequest,
  ApplicationResponse,
  ApplicationListItemResponse,
} from './dto/application.dto';

function toJsonValue(val: Record<string, unknown>): Prisma.InputJsonValue {
  return val as Prisma.InputJsonValue;
}

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autoReviewService: AutoReviewService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  async submit(
    candidateId: string,
    request: ApplicationSubmitRequest,
  ): Promise<ApplicationResponse> {
    const exam = await this.client.exam.findUnique({
      where: { id: request.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    // Check registration window (Ref: ApplicationApplicationService.java:99)
    const now = new Date();
    if (exam.registrationStart && now < exam.registrationStart) {
      throw new BadRequestException('Registration has not started yet');
    }
    if (exam.registrationEnd && now > exam.registrationEnd) {
      throw new BadRequestException('Registration has closed');
    }

    const application = await this.client.application.upsert({
      where: {
        examId_candidateId: {
          examId: request.examId,
          candidateId: candidateId,
        },
      },
      update: {
        positionId: request.positionId,
        payload: toJsonValue(request.payload),
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        candidateId: candidateId,
        examId: request.examId,
        positionId: request.positionId,
        payload: toJsonValue(request.payload),
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Handle attachments
    if (request.attachments && request.attachments.length > 0) {
      for (const attachment of request.attachments) {
        await this.client.fileRecord.update({
          where: { id: attachment.fileId },
          data: {
            applicationId: application.id,
            status: 'AVAILABLE',
            fieldKey: attachment.fieldKey,
          },
        });
      }
    }

    // ✅ 触发自动审核（异步处理，不阻塞响应）
    this.triggerAutoReview(application.id).catch((error) => {
      this.logger.error(
        `Auto-review failed for application ${application.id}: ${error.message}`,
      );
    });

    return this.mapToResponse(application);
  }

  /**
   * 触发自动审核
   */
  private async triggerAutoReview(applicationId: string): Promise<void> {
    try {
      this.logger.log(`Triggering auto-review for application: ${applicationId}`);

      // 1. 执行自动审核
      const result =
        await this.autoReviewService.executeAutoReview(applicationId);

      // 2. 应用审核结果
      await this.autoReviewService.applyAutoReviewResult(applicationId, result);

      this.logger.log(
        `Auto-review completed for ${applicationId}: ${result.passed ? 'PASSED' : 'FAILED'}`,
      );
    } catch (error) {
      this.logger.error(
        `Auto-review error for ${applicationId}: ${error.message}`,
      );
      // 不抛出错误，让报名流程继续
    }
  }

  async saveDraft(
    candidateId: string,
    request: ApplicationSubmitRequest,
  ): Promise<ApplicationResponse> {
    const application = await this.client.application.upsert({
      where: {
        examId_candidateId: {
          examId: request.examId,
          candidateId: candidateId,
        },
      },
      update: {
        positionId: request.positionId,
        payload: toJsonValue(request.payload),
        status: 'DRAFT',
      },
      create: {
        candidateId: candidateId,
        examId: request.examId,
        positionId: request.positionId,
        payload: toJsonValue(request.payload),
        status: 'DRAFT',
      },
    });

    // Handle attachments for drafts
    if (request.attachments && request.attachments.length > 0) {
      for (const attachment of request.attachments) {
        await this.client.fileRecord.update({
          where: { id: attachment.fileId },
          data: {
            applicationId: application.id,
            status: 'AVAILABLE',
            fieldKey: attachment.fieldKey,
          },
        });
      }
    }

    return this.mapToResponse(application);
  }

  async listMyEnriched(
    candidateId: string,
  ): Promise<ApplicationListItemResponse[]> {
    const apps = await this.client.application.findMany({
      where: { candidateId, status: { not: 'DRAFT' } },
      include: {
        exam: true,
        position: true,
        attachments: true,
      },
    });

    return apps.map((app) => ({
      ...this.mapToResponse(app),
      examTitle: app.exam.title,
      positionTitle: app.position.title,
      feeRequired: app.exam.feeRequired,
      feeAmount: app.exam.feeAmount ? Number(app.exam.feeAmount) : 0,
    }));
  }

  async listMyDrafts(
    candidateId: string,
  ): Promise<ApplicationListItemResponse[]> {
    const apps = await this.client.application.findMany({
      where: { candidateId, status: 'DRAFT' },
      include: {
        exam: true,
        position: true,
        attachments: true,
      },
    });

    return apps.map((app) => ({
      ...this.mapToResponse(app),
      examTitle: app.exam.title,
      positionTitle: app.position.title,
      feeRequired: app.exam.feeRequired,
      feeAmount: app.exam.feeAmount ? Number(app.exam.feeAmount) : 0,
    }));
  }

  async listAll(params: {
    examId?: string;
    status?: string;
    page: number;
    size: number;
  }) {
    const { examId, status, page, size } = params;
    const skip = page * size;
    const where: any = {};

    if (examId) {
      where.examId = examId;
    }
    if (status) {
      where.status = status;
    }

    const [apps, total] = await Promise.all([
      this.client.application.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: { select: { id: true, title: true } },
          position: { select: { id: true, title: true } },
        },
      }),
      this.client.application.count({ where }),
    ]);

    return {
      content: apps.map((app) => ({
        id: app.id,
        examId: app.examId,
        positionId: app.positionId,
        candidateId: app.candidateId,
        status: app.status,
        submittedAt: app.submittedAt,
        createdAt: app.createdAt,
        examTitle: app.exam.title,
        positionTitle: app.position.title,
      })),
      total,
    };
  }

  async findById(id: string): Promise<ApplicationResponse> {
    const app = await this.client.application.findUnique({
      where: { id },
      include: { attachments: true },
    });
    if (!app) throw new NotFoundException('Application not found');
    return this.mapToResponse(app);
  }

  private mapToResponse(
    app: Application & { attachments?: FileRecord[] },
  ): ApplicationResponse {
    return {
      id: app.id,
      examId: app.examId,
      positionId: app.positionId,
      candidateId: app.candidateId,
      formVersion: app.formVersion,
      status: app.status,
      submittedAt: app.submittedAt || undefined,
      attachments: app.attachments?.map((a) => ({
        fileId: a.id,
        fieldKey: a.fieldKey || '',
      })),
    };
  }
}
