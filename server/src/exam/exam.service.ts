import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { Exam, Position, Prisma, Subject, Tenant } from '@prisma/client';
import {
  ExamStatus,
  ApplicationStatus,
  TenantStatus,
} from '../common/enums';
import {
  ExamCreateRequest,
  ExamUpdateRequest,
  ExamResponse,
  ExamStatistics,
} from './dto/exam.dto';
import { UpdateExamRulesRequest } from './dto/exam-rules.dto';
import {
  PublicExamAnnouncementResponse,
  PublicExamResponse,
} from './dto/public-exam.dto';
import { PositionResponse } from './dto/position.dto';

function jsonObjectFromTemplate(
  v: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (v === null || v === undefined) return {};
  if (typeof v === 'object' && !Array.isArray(v)) {
    return { ...(v as Record<string, Prisma.JsonValue>) };
  }
  return {};
}

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  async findAll(
    page = 0,
    size = 10,
    status?: string,
  ): Promise<{ content: ExamResponse[]; total: number }> {
    const skip = page * size;
    const where = status ? { status } : {};

    const [exams, total] = await Promise.all([
      this.client.exam.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.client.exam.count({ where }),
    ]);

    return {
      content: exams.map((e) => this.mapToResponse(e)),
      total,
    };
  }

  async findById(id: string): Promise<ExamResponse> {
    const exam = await this.client.exam.findUnique({
      where: { id },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.mapToResponse(exam);
  }

  async findByCode(code: string): Promise<ExamResponse> {
    const exam = await this.client.exam.findUnique({
      where: { code },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.mapToResponse(exam);
  }

  async create(
    request: ExamCreateRequest,
    userId: string,
  ): Promise<ExamResponse> {
    const existing = await this.client.exam.findUnique({
      where: { code: request.code },
    });
    if (existing) throw new BadRequestException('Exam code already exists');

    const exam = await this.client.exam.create({
      data: {
        code: request.code,
        title: request.title,
        description: request.description,
        announcement: request.announcement,
        registrationStart: request.registrationStart
          ? new Date(request.registrationStart)
          : null,
        registrationEnd: request.registrationEnd
          ? new Date(request.registrationEnd)
          : null,
        examStart: request.examStart ? new Date(request.examStart) : null,
        examEnd: request.examEnd ? new Date(request.examEnd) : null,
        feeRequired: request.feeRequired ?? false,
        feeAmount: request.feeAmount,
        createdBy: userId,
        status: ExamStatus.DRAFT,
      },
    });

    return this.mapToResponse(exam);
  }

  async update(id: string, request: ExamUpdateRequest): Promise<ExamResponse> {
    const exam = await this.client.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    const updated = await this.client.exam.update({
      where: { id },
      data: {
        title: request.title,
        description: request.description,
        announcement: request.announcement,
        registrationStart: request.registrationStart
          ? new Date(request.registrationStart)
          : null,
        registrationEnd: request.registrationEnd
          ? new Date(request.registrationEnd)
          : null,
        examStart: request.examStart ? new Date(request.examStart) : null,
        examEnd: request.examEnd ? new Date(request.examEnd) : null,
        feeRequired: request.feeRequired,
        feeAmount: request.feeAmount,
        status: request.status,
      },
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const exam = await this.client.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Check for applications before deleting
    const hasApps = await this.client.application.findFirst({
      where: { examId: id },
    });
    if (hasApps)
      throw new BadRequestException(
        'Cannot delete exam with existing applications',
      );

    await this.client.exam.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<ExamResponse> {
    const exam = await this.client.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    const updated = await this.client.exam.update({
      where: { id },
      data: { status },
    });

    // TODO: Publish to global catalog if status is OPEN (mirrors Spring Boot logic)

    return this.mapToResponse(updated);
  }

  async updateFormTemplate(examId: string, templateId: string): Promise<void> {
    const exam = await this.client.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const currentFormTemplate = jsonObjectFromTemplate(exam.formTemplate);
    await this.client.exam.update({
      where: { id: examId },
      data: {
        formTemplate: {
          ...currentFormTemplate,
          templateId,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async updateFormTemplateData(
    examId: string,
    formTemplateData: Prisma.InputJsonValue,
  ): Promise<void> {
    const exam = await this.client.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    await this.client.exam.update({
      where: { id: examId },
      data: { formTemplate: formTemplateData },
    });
  }

  /** Exam-level rules are stored under `formTemplate.examRules` (JSON). */
  async getExamRulesConfig(examId: string): Promise<Record<string, unknown>> {
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
      select: { formTemplate: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    const ft = exam.formTemplate;
    if (
      ft &&
      typeof ft === 'object' &&
      !Array.isArray(ft) &&
      'examRules' in ft
    ) {
      const er = (ft as Record<string, unknown>)['examRules'];
      if (er && typeof er === 'object' && !Array.isArray(er)) {
        return er as Record<string, unknown>;
      }
    }
    return { rules: [] };
  }

  async updateExamRules(
    examId: string,
    request: UpdateExamRulesRequest,
  ): Promise<void> {
    const exam = await this.client.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    const cur = exam.formTemplate;
    const base =
      cur && typeof cur === 'object' && !Array.isArray(cur)
        ? { ...(cur as Record<string, unknown>) }
        : {};
    await this.client.exam.update({
      where: { id: examId },
      data: {
        formTemplate: {
          ...base,
          examRules: { rules: request.rules ?? [] },
        } as Prisma.InputJsonValue,
      },
    });
  }

  async findOpenPublicExams(): Promise<PublicExamResponse[]> {
    const tenants = await this.prisma.publicClient.tenant.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
    const now = new Date();
    const exams: PublicExamResponse[] = [];

    for (const tenant of tenants) {
      const tenantExams = await PrismaService.runInTenantContext(
        tenant.schemaName,
        async () =>
          this.prisma.client.exam.findMany({
            where: {
              status: ExamStatus.OPEN,
              registrationStart: { lte: now },
              registrationEnd: { gte: now },
            },
            include: {
              _count: {
                select: {
                  positions: true,
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          }),
      );

      exams.push(
        ...tenantExams.map((exam) =>
          this.mapToPublicExamResponse(tenant, exam, exam._count.positions),
        ),
      );
    }

    return exams.sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt
        ? new Date(right.updatedAt).getTime()
        : 0;
      return rightTime - leftTime;
    });
  }

  async findPublicExamByTenantAndCode(
    tenantCode: string,
    code: string,
  ): Promise<PublicExamResponse> {
    const tenant = await this.getActiveTenantByCode(tenantCode);

    return PrismaService.runInTenantContext(tenant.schemaName, async () => {
      const exam = await this.prisma.client.exam.findUnique({
        where: { code },
        include: {
          _count: {
            select: {
              positions: true,
            },
          },
        },
      });

      if (!exam || exam.status !== ExamStatus.OPEN) {
        throw new NotFoundException('Exam not found');
      }

      return this.mapToPublicExamResponse(tenant, exam, exam._count.positions);
    });
  }

  async findPublicExamPositions(
    tenantCode: string,
    code: string,
  ): Promise<PositionResponse[]> {
    const tenant = await this.getActiveTenantByCode(tenantCode);

    return PrismaService.runInTenantContext(tenant.schemaName, async () => {
      const exam = await this.prisma.client.exam.findUnique({
        where: { code },
        select: { id: true, status: true },
      });

      if (!exam || exam.status !== ExamStatus.OPEN) {
        throw new NotFoundException('Exam not found');
      }

      const positions = await this.prisma.client.position.findMany({
        where: { examId: exam.id },
        include: { subjects: { orderBy: { ordering: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      });

      return positions.map((position) => this.mapPositionToResponse(position));
    });
  }

  async findPublicExamAnnouncement(
    tenantCode: string,
    code: string,
  ): Promise<PublicExamAnnouncementResponse> {
    const tenant = await this.getActiveTenantByCode(tenantCode);

    return PrismaService.runInTenantContext(tenant.schemaName, async () => {
      const exam = await this.prisma.client.exam.findUnique({
        where: { code },
        select: { status: true, announcement: true },
      });

      if (!exam || exam.status !== 'OPEN') {
        throw new NotFoundException('Exam not found');
      }

      return { content: exam.announcement ?? '' };
    });
  }

  private mapToResponse(exam: Exam): ExamResponse {
    return {
      id: exam.id,
      code: exam.code,
      title: exam.title,
      description: exam.description || undefined,
      announcement: exam.announcement || undefined,
      registrationStart: exam.registrationStart || undefined,
      registrationEnd: exam.registrationEnd || undefined,
      examStart: exam.examStart || undefined, // examStart/examEnd fields confirmed
      examEnd: exam.examEnd || undefined,
      feeRequired: exam.feeRequired,
      feeAmount: exam.feeAmount ? Number(exam.feeAmount) : undefined,
      status: exam.status,
      formTemplate: exam.formTemplate ?? undefined,
      createdBy: exam.createdBy || undefined,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    };
  }

  async getStatistics(id: string): Promise<ExamStatistics> {
    const exam = await this.findById(id);
    const [applications, tickets, paymentOrders] = await Promise.all([
      this.client.application.findMany({
        where: { examId: id },
      }),
      this.client.ticket.findMany({
        where: { examId: id, status: 'ACTIVE' },
      }),
      this.client.paymentOrder.findMany({
        where: {
          status: 'SUCCESS',
          applicationId: {
            in: (
              await this.client.application.findMany({
                where: { examId: id },
                select: { id: true },
              })
            ).map((a: { id: string }) => a.id),
          },
        },
      }),
    ]);

    const paidApplicationIds = new Set(
      paymentOrders.map((p) => p.applicationId),
    );
    const ticketApplicationIds = new Set(tickets.map((t) => t.applicationId));

    const counts = {
      total: applications.length,
      draft: applications.filter((a) => a.status === ApplicationStatus.DRAFT).length,
      submitted: applications.filter((a) => a.status === ApplicationStatus.SUBMITTED).length,
      pendingPrimary: applications.filter(
        (a) => a.status === ApplicationStatus.PENDING_PRIMARY_REVIEW,
      ).length,
      primaryPassed: applications.filter((a) => a.status === ApplicationStatus.PRIMARY_PASSED)
        .length,
      primaryRejected: applications.filter(
        (a) => a.status === ApplicationStatus.PRIMARY_REJECTED,
      ).length,
      pendingSecondary: applications.filter(
        (a) => a.status === ApplicationStatus.PENDING_SECONDARY_REVIEW,
      ).length,
      approved: applications.filter((a) => a.status === ApplicationStatus.APPROVED).length,
      secondaryRejected: applications.filter(
        (a) => a.status === ApplicationStatus.SECONDARY_REJECTED,
      ).length,
      paid: applications.filter((a) => paidApplicationIds.has(a.id)).length,
      ticketIssued: applications.filter((a) => ticketApplicationIds.has(a.id))
        .length,
    };

    return {
      examId: exam.id,
      examCode: exam.code,
      examTitle: exam.title,
      totalApplications: counts.total,
      draftApplications: counts.draft,
      submittedApplications: counts.submitted,
      pendingPrimaryReviewApplications: counts.pendingPrimary,
      primaryPassedApplications: counts.primaryPassed,
      primaryRejectedApplications: counts.primaryRejected,
      pendingSecondaryReviewApplications: counts.pendingSecondary,
      approvedApplications: counts.approved,
      secondaryRejectedApplications: counts.secondaryRejected,
      paidApplications: counts.paid,
      ticketIssuedApplications: counts.ticketIssued,
      primaryApprovalRate:
        counts.total > 0 ? (counts.primaryPassed / counts.total) * 100 : 0,
      secondaryApprovalRate:
        counts.primaryPassed > 0
          ? (counts.approved / counts.primaryPassed) * 100
          : 0,
      overallApprovalRate:
        counts.total > 0 ? (counts.approved / counts.total) * 100 : 0,
    };
  }

  async listReviewers(examId: string) {
    const rows = await this.client.examReviewer.findMany({
      where: { examId },
      orderBy: { createdAt: 'asc' },
    });
    if (rows.length === 0) {
      return [];
    }

    const userIds = [...new Set(rows.map((r) => r.reviewerId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((r) => ({
      id: String(r.id),
      examId: r.examId,
      userId: r.reviewerId,
      role:
        r.stage === 'PRIMARY'
          ? 'PRIMARY_REVIEWER'
          : ('SECONDARY_REVIEWER' as const),
      username: userMap.get(r.reviewerId)?.username,
      fullName: userMap.get(r.reviewerId)?.fullName,
      email: userMap.get(r.reviewerId)?.email,
      assignedAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Users in the tenant who may be assigned as exam reviewers (tenant roles:
   * PRIMARY_REVIEWER, SECONDARY_REVIEWER, TENANT_ADMIN per getTenantUsersCategorized).
   */
  async listAvailableReviewersForExam(examId: string, tenantId: string) {
    await this.findById(examId);
    const { reviewers } =
      await this.userService.getTenantUsersCategorized(tenantId);
    return reviewers.map((entry) => ({
      id: entry.user.id,
      username: entry.user.username,
      fullName: entry.user.fullName ?? entry.user.username,
      email: entry.user.email,
      roles: entry.tenantRoles,
    }));
  }

  async addExamReviewer(
    examId: string,
    tenantId: string,
    userId: string,
    role: 'PRIMARY_REVIEWER' | 'SECONDARY_REVIEWER',
  ) {
    await this.findById(examId);
    const { reviewers } =
      await this.userService.getTenantUsersCategorized(tenantId);
    const allowed = reviewers.some((r) => r.user.id === userId);
    if (!allowed) {
      throw new BadRequestException(
        'User is not a reviewer or admin in this tenant',
      );
    }

    const stage = role === 'PRIMARY_REVIEWER' ? 'PRIMARY' : 'SECONDARY';
    const existing = await this.client.examReviewer.findFirst({
      where: { examId, reviewerId: userId, stage },
    });
    if (existing) {
      throw new BadRequestException(
        'This user is already assigned for this review stage',
      );
    }

    await this.client.examReviewer.create({
      data: { examId, reviewerId: userId, stage },
    });

    const list = await this.listReviewers(examId);
    return (
      list.find((r) => r.userId === userId && r.role === role) ??
      list[list.length - 1]
    );
  }

  async removeExamReviewerAssignment(examId: string, assignmentId: string) {
    await this.findById(examId);
    let rowId: bigint;
    try {
      rowId = BigInt(assignmentId);
    } catch {
      throw new BadRequestException('Invalid reviewer assignment id');
    }
    const row = await this.client.examReviewer.findFirst({
      where: { id: rowId, examId },
    });
    if (!row) {
      throw new NotFoundException('Reviewer assignment not found');
    }
    await this.client.examReviewer.delete({ where: { id: row.id } });
  }

  private async getActiveTenantByCode(tenantCode: string): Promise<Tenant> {
    const tenant = await this.prisma.publicClient.tenant.findFirst({
      where: {
        code: tenantCode,
        status: TenantStatus.ACTIVE,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  private mapToPublicExamResponse(
    tenant: Tenant,
    exam: Exam,
    positionCount: number,
  ): PublicExamResponse {
    return {
      id: exam.id,
      examId: exam.id,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCode: tenant.code,
      code: exam.code,
      title: exam.title,
      description: exam.description ?? undefined,
      announcement: exam.announcement ?? undefined,
      registrationStart: exam.registrationStart ?? undefined,
      registrationEnd: exam.registrationEnd ?? undefined,
      examStart: exam.examStart ?? undefined,
      examEnd: exam.examEnd ?? undefined,
      feeRequired: exam.feeRequired,
      feeAmount: exam.feeAmount ? Number(exam.feeAmount) : undefined,
      status: exam.status,
      positionCount,
      updatedAt: exam.updatedAt,
    };
  }

  private mapPositionToResponse(
    position: Position & { subjects?: Subject[] },
  ): PositionResponse {
    return {
      id: position.id,
      examId: position.examId,
      code: position.code,
      title: position.title,
      description: position.description ?? undefined,
      requirements: position.requirements ?? undefined,
      quota: position.quota ?? undefined,
      rulesConfig: position.rulesConfig ?? undefined,
      subjects: position.subjects?.map((subject) => ({
        id: subject.id,
        name: subject.name,
        durationMinutes: subject.durationMinutes,
        type: subject.type,
        maxScore: subject.maxScore ? Number(subject.maxScore) : undefined,
        passingScore: subject.passingScore
          ? Number(subject.passingScore)
          : undefined,
        weight: Number(subject.weight),
        ordering: subject.ordering,
        createdAt: subject.createdAt,
      })),
      createdAt: position.createdAt,
    };
  }
}
