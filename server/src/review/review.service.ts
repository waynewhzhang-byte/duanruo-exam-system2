import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getErrorMessage } from '../common/utils/error.util';
import {
  ReviewStage,
  PullTaskRequest,
  DecisionTaskRequest,
} from './dto/review.dto';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../common/notification/notification.service';
import { ApplicationStatus } from '../common/enums';

interface QueueTaskRaw {
  id: string;
  application_id: string;
  stage: string;
  status: string;
  assigned_to: string | null;
  locked_at: Date | null;
  last_heartbeat_at: Date | null;
  created_at: Date;
}

interface CountResultRaw {
  total: bigint;
}

interface HistoryReviewRaw {
  id: string;
  application_id: string;
  stage: string;
  reviewer_id: string;
  decision: string | null;
  comment: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly LOCK_TTL_MINUTES = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  async pullNext(reviewerId: string, request: PullTaskRequest) {
    const { examId, stage } = request;

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

    let targetStatus: string[];
    if (stage === ReviewStage.PRIMARY) {
      targetStatus = [
        ApplicationStatus.PENDING_PRIMARY_REVIEW,
        ApplicationStatus.SUBMITTED,
      ];
    } else {
      targetStatus = [
        ApplicationStatus.PENDING_SECONDARY_REVIEW,
        ApplicationStatus.PRIMARY_PASSED,
      ];
    }

    const applications = await this.client.application.findMany({
      where: {
        examId: examId,
        status: { in: targetStatus },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (applications.length === 0) {
      return null;
    }

    const applicationIds = applications.map((a) => a.id);

    // Atomic transaction to find and claim the next available application
    const result = await this.client.$transaction(async (tx) => {
      // 1. Double check for active tasks within the transaction
      const activeTasks = await tx.reviewTask.findMany({
        where: {
          applicationId: { in: applicationIds },
          stage: stage,
          status: 'ASSIGNED',
          lockedAt: { gt: lockThreshold },
        },
        select: { applicationId: true },
      });

      const activeApplicationIds = new Set(
        activeTasks.map((t) => t.applicationId),
      );

      // 2. Find the first application that really doesn't have an active task
      const availableApp = applications.find(
        (app) => !activeApplicationIds.has(app.id),
      );

      if (!availableApp) {
        return null;
      }

      // 3. Create and assign the task atomically
      const task = await tx.reviewTask.create({
        data: {
          id: uuidv4(),
          applicationId: availableApp.id,
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
    });

    return result;
  }

  async decide(reviewerId: string, request: DecisionTaskRequest) {
    const { taskId, approve, reason, evidenceFileIds } = request;

    const task = await this.client.reviewTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === 'COMPLETED') {
      throw new BadRequestException('This review task is already completed');
    }

    if (task.assignedTo && task.assignedTo !== reviewerId) {
      throw new BadRequestException('Task is assigned to another reviewer');
    }

    let taskForDecide: typeof task;

    if (task.status === 'OPEN') {
      const now = new Date();
      // 领取未分配任务，便于管理端批量审核、二审任务在「拉取」前即出现在队列中
      taskForDecide = await this.client.reviewTask.update({
        where: { id: taskId },
        data: {
          status: 'ASSIGNED',
          assignedTo: reviewerId,
          lockedAt: now,
          lastHeartbeatAt: now,
        },
      });
    } else if (task.status === 'ASSIGNED' && task.assignedTo === reviewerId) {
      taskForDecide = task;
    } else {
      throw new BadRequestException('Task not in a decidable state');
    }

    const lockThreshold = new Date();
    lockThreshold.setMinutes(
      lockThreshold.getMinutes() - this.LOCK_TTL_MINUTES,
    );
    if (!taskForDecide.lockedAt || taskForDecide.lockedAt < lockThreshold) {
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

    return await this.client.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: app.id },
        data: { status: toStatus, updatedAt: new Date() },
      });

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

      await tx.reviewTask.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
      });

      if (toStatus === 'PRIMARY_PASSED') {
        await tx.application.update({
          where: { id: app.id },
          data: { status: ApplicationStatus.PENDING_SECONDARY_REVIEW },
        });
        await tx.applicationAuditLog.create({
          data: {
            id: uuidv4(),
            applicationId: app.id,
            fromStatus: ApplicationStatus.PRIMARY_PASSED,
            toStatus: ApplicationStatus.PENDING_SECONDARY_REVIEW,
            actor: 'SYSTEM',
            reason: 'Auto-enter secondary review',
          },
        });
        // 预创建二审任务（OPEN），管理端/二审「待审」列表可见，且可不经 pull 直接 batch decide
        const existingSecondary = await tx.reviewTask.findFirst({
          where: {
            applicationId: app.id,
            stage: 'SECONDARY',
            status: { in: ['OPEN', 'ASSIGNED'] },
          },
        });
        if (!existingSecondary) {
          await tx.reviewTask.create({
            data: {
              id: uuidv4(),
              applicationId: app.id,
              stage: 'SECONDARY',
              status: 'OPEN',
            },
          });
        }
      }

      // 异步发送通知 (Async notification)
      this.sendReviewNotification(app.candidateId, app.examId, toStatus).catch(
        (err: unknown) =>
          this.logger.error(
            `Failed to send review notification: ${getErrorMessage(err)}`,
          ),
      );

      return { applicationId: app.id, fromStatus, toStatus };
    });
  }

  /**
   * Helper to fetch candidate info and send notification
   */
  private async sendReviewNotification(
    candidateId: string,
    examId: string,
    status: string,
  ) {
    try {
      const [user, exam] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: candidateId },
          select: { email: true, fullName: true },
        }),
        this.client.exam.findUnique({
          where: { id: examId },
          select: { title: true },
        }),
      ]);

      if (user?.email) {
        await this.notificationService.notifyReviewResult(
          user.email,
          user.fullName,
          exam?.title || '考试',
          status,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in sendReviewNotification: ${getErrorMessage(error)}`,
      );
    }
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
    const offset = page * size;

    const statusClause = status ? `AND rt.status = $4` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM review_tasks rt
      JOIN applications a ON rt.application_id = a.id
      WHERE a.exam_id = $1 
        AND rt.stage = $2
        ${statusClause}
    `;

    const dataQuery = `
      SELECT 
        rt.id,
        rt.application_id,
        rt.stage,
        rt.status,
        rt.assigned_to,
        rt.locked_at,
        rt.last_heartbeat_at,
        rt.created_at
      FROM review_tasks rt
      JOIN applications a ON rt.application_id = a.id
      WHERE a.exam_id = $1 
        AND rt.stage = $2
        ${statusClause}
      ORDER BY rt.created_at DESC
      LIMIT $3 OFFSET $${status ? 5 : 4}
    `;

    const countParams = status ? [examId, stage, status] : [examId, stage];
    const dataParams = status
      ? [examId, stage, size, offset, status]
      : [examId, stage, size, offset];

    const [countResult, tasks] = await Promise.all([
      this.client.$queryRawUnsafe<CountResultRaw[]>(countQuery, ...countParams),
      this.client.$queryRawUnsafe<QueueTaskRaw[]>(dataQuery, ...dataParams),
    ]);

    const total = Number(countResult[0]?.total ?? 0);

    return {
      content: tasks.map((t) => ({
        id: t.id,
        applicationId: t.application_id,
        stage: t.stage,
        status: t.status,
        assignedTo: t.assigned_to,
        lockedAt: t.locked_at,
        lastHeartbeatAt: t.last_heartbeat_at,
        createdAt: t.created_at,
      })),
      total,
    };
  }

  async getHistory(params: {
    examId?: string;
    reviewerId?: string;
    page: number;
    size: number;
  }) {
    const { examId, reviewerId, page, size } = params;
    const offset = page * size;

    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (examId) {
      conditions.push(`a.exam_id = $${paramIndex}`);
      queryParams.push(examId);
      paramIndex++;
    }

    if (reviewerId) {
      conditions.push(`r.reviewer_id = $${paramIndex}`);
      queryParams.push(reviewerId);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN applications a ON r.application_id = a.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        r.id,
        r.application_id,
        r.stage,
        r.reviewer_id,
        r.decision,
        r.comment,
        r.reviewed_at,
        r.created_at
      FROM reviews r
      JOIN applications a ON r.application_id = a.id
      ${whereClause}
      ORDER BY r.reviewed_at DESC NULLS LAST, r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const [countResult, reviews] = await Promise.all([
      this.client.$queryRawUnsafe<CountResultRaw[]>(countQuery, ...queryParams),
      this.client.$queryRawUnsafe<HistoryReviewRaw[]>(
        dataQuery,
        ...queryParams,
        size,
        offset,
      ),
    ]);

    const total = Number(countResult[0]?.total ?? 0);

    return {
      content: reviews.map((r) => ({
        id: r.id,
        applicationId: r.application_id,
        stage: r.stage,
        reviewerId: r.reviewer_id,
        decision: r.decision,
        comment: r.comment,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
      })),
      total,
    };
  }

  async batchDecide(
    reviewerId: string,
    decisions: { id: string; decision: boolean; reason?: string }[],
  ) {
    const result = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const { id, decision, reason } of decisions) {
      try {
        await this.decide(reviewerId, {
          taskId: id,
          approve: decision,
          reason: reason || '',
        });
        result.success.push(id);
      } catch (error) {
        result.failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /** Dashboard: assigned tasks + reviews completed today / this week */
  async getMyStats(reviewerId: string): Promise<{
    myAssigned: number;
    todayDone: number;
    weekDone: number;
  }> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday);
    const dow = startOfToday.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dow);

    const [myAssigned, todayDone, weekDone] = await Promise.all([
      this.client.reviewTask.count({
        where: {
          assignedTo: reviewerId,
          status: 'ASSIGNED',
        },
      }),
      this.client.review.count({
        where: {
          reviewerId,
          reviewedAt: { gte: startOfToday },
          decision: { not: null },
        },
      }),
      this.client.review.count({
        where: {
          reviewerId,
          reviewedAt: { gte: startOfWeek },
          decision: { not: null },
        },
      }),
    ]);

    return { myAssigned, todayDone, weekDone };
  }
}
