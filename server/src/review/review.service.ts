import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewStage,
  PullTaskRequest,
  DecisionTaskRequest,
} from './dto/review.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly LOCK_TTL_MINUTES = 10;

  constructor(private readonly prisma: PrismaService) { }

  private get client() {
    return this.prisma.client;
  }

  async pullNext(reviewerId: string, request: PullTaskRequest) {
    const { examId, stage } = request;

    // 1) Check for existing unexpired task assigned to this reviewer
    const lockThreshold = new Date();
    lockThreshold.setMinutes(
      lockThreshold.getMinutes() - this.LOCK_TTL_MINUTES,
    );

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
        lockedUntil: new Date(
          existingTask.lockedAt.getTime() + this.LOCK_TTL_MINUTES * 60000,
        ),
      };
    }

    // 2) Find candidates for review
    let targetStatus: string[];
    if (stage === ReviewStage.PRIMARY) {
      targetStatus = ['PENDING_PRIMARY_REVIEW', 'SUBMITTED'];
    } else {
      // SECONDARY
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
      // Check if there's already an active task for this application and stage
      const activeTask = await this.client.reviewTask.findFirst({
        where: {
          applicationId: app.id,
          stage: stage,
          status: 'ASSIGNED',
          lockedAt: { gt: lockThreshold },
        },
      });

      if (activeTask) continue;

      // Create a new task (or reuse an old expired one)
      const task = await this.client.reviewTask.create({
        data: {
          id: uuidv4(),
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
        lockedUntil: new Date(
          (task.lockedAt as Date).getTime() + this.LOCK_TTL_MINUTES * 60000,
        ),
      };
    }

    return null; // No task available
  }

  async decide(reviewerId: string, request: DecisionTaskRequest) {
    const { taskId, approve, reason, evidenceFileIds } = request;

    const task = await this.client.reviewTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
      throw new BadRequestException('Task not found or not assigned to you');
    }

    // Check lock expiration
    const lockThreshold = new Date();
    lockThreshold.setMinutes(
      lockThreshold.getMinutes() - this.LOCK_TTL_MINUTES,
    );
    if (!task.lockedAt || task.lockedAt < lockThreshold) {
      throw new BadRequestException('Task lock expired');
    }

    const app = await this.client.application.findUnique({
      where: { id: task.applicationId },
    });

    if (!app) throw new NotFoundException('Application not found');

    const fromStatus = app.status;
    let toStatus: string;

    if (task.stage === 'PRIMARY') {
      toStatus = approve ? 'PRIMARY_PASSED' : 'PRIMARY_REJECTED';
    } else {
      toStatus = approve ? 'APPROVED' : 'SECONDARY_REJECTED';
    }

    // Begin Transaction
    return await this.client.$transaction(async (tx) => {
      // 1) Update Application
      await tx.application.update({
        where: { id: app.id },
        data: { status: toStatus, updatedAt: new Date() },
      });

      // 2) Create Review record
      const reviewOutcome = approve ? 'APPROVED' : 'REJECTED';
      await tx.review.create({
        data: {
          id: uuidv4(),
          applicationId: app.id,
          stage: task.stage,
          reviewerId: reviewerId,
          decision: reviewOutcome,
          comment: reason,
          reviewedAt: new Date(),
        },
      });

      // 3) Record Audit Log
      await tx.applicationAuditLog.create({
        data: {
          id: uuidv4(),
          applicationId: app.id,
          fromStatus: fromStatus,
          toStatus: toStatus,
          actor: reviewerId,
          reason: reason,
          metadata: evidenceFileIds ? { evidenceFileIds } : undefined,
        },
      });

      // 4) Complete Task
      await tx.reviewTask.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
      });

      // 5) Special logic: if primary passed, automatically enter pending secondary
      if (toStatus === 'PRIMARY_PASSED') {
        // This is often handled by another task or automatically
        // Here we'll just update the status to PENDING_SECONDARY_REVIEW if that's the desired flow
        await tx.application.update({
          where: { id: app.id },
          data: { status: 'PENDING_SECONDARY_REVIEW' },
        });
        await tx.applicationAuditLog.create({
          data: {
            id: uuidv4(),
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

  async getByApplicationId(applicationId: string) {
    const reviews = await this.client.review.findMany({
      where: { applicationId },
      orderBy: { reviewedAt: 'asc' },
    });
    return reviews;
  }

  async heartbeat(taskId: string, reviewerId: string) {
    const task = await this.client.reviewTask.findUnique({
      where: { id: taskId },
    });
    if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
      throw new BadRequestException('Task not found or not assigned to you');
    }
    await this.client.reviewTask.update({
      where: { id: taskId },
      data: { lastHeartbeatAt: new Date(), lockedAt: new Date() },
    });
    return { success: true };
  }

  async release(taskId: string, reviewerId: string) {
    const task = await this.client.reviewTask.findUnique({
      where: { id: taskId },
    });
    if (!task || task.assignedTo !== reviewerId || task.status !== 'ASSIGNED') {
      throw new BadRequestException('Task not found or not assigned to you');
    }
    await this.client.reviewTask.update({
      where: { id: taskId },
      data: { status: 'OPEN', assignedTo: null, lockedAt: null },
    });
    return { success: true };
  }

  async getQueue(params: {
    examId: string;
    stage: string;
    status?: string;
    page: number;
    size: number;
  }) {
    const { examId, stage, status, page, size } = params;
    const skip = page * size;
    const where: any = { stage };

    if (status) {
      where.status = status;
    }

    // Since reviewTask doesn't have a direct relation to Exam in the schema (it's via Application),
    // we need to filter by application's examId.
    where.applicationId = {
      in: (
        await this.client.application.findMany({
          where: { examId },
          select: { id: true },
        })
      ).map((a: { id: string }) => a.id),
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
}
