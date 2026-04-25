import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, type Subject } from '@prisma/client';
import { ExamService } from './exam.service';
import { PositionService } from './position.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExamCreateRequest,
  ExamUpdateRequest,
  ExamResponse,
} from './dto/exam.dto';
import { PositionCreateRequest } from './dto/position.dto';
import {
  UpdatePositionRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  UpdateExamRulesRequest,
  UpdatePositionRulesRequest,
} from './dto/exam-rules.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApplicationService } from '../application/application.service';
import { TicketService } from '../ticket/ticket.service';
import { ScoreService } from './score.service';
import { ExamStatus } from '../common/enums';

function resolveTenantIdFromRequest(req: AuthenticatedRequest): string {
  const header = req.headers['x-tenant-id'];
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  if (req.user?.tenantId) {
    return req.user.tenantId;
  }
  throw new BadRequestException('Tenant context is required');
}

@Controller('exams')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly positionService: PositionService,
    private readonly prisma: PrismaService,
    private readonly applicationService: ApplicationService,
    private readonly ticketService: TicketService,
    private readonly scoreService: ScoreService,
  ) {}

  @Get()
  @Permissions('exam:view')
  async getAll(
    @Query('page') page = 0,
    @Query('size') size = 10,
    @Query('status') status?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<PaginatedResponse<ExamResponse>> {
    const headerTenantId = req?.headers?.['x-tenant-id'];
    const headerTenantSlug = req?.headers?.['x-tenant-slug'];
    const tenantHeaderId =
      typeof headerTenantId === 'string' ? headerTenantId : undefined;
    const tenantHeaderSlug =
      typeof headerTenantSlug === 'string' ? headerTenantSlug : undefined;

    const { content, total } = await this.examService.findAllByTenantContext(
      Number(page),
      Number(size),
      status,
      {
        tenantId: tenantHeaderId ?? req?.user?.tenantId,
        tenantSlug: tenantHeaderSlug,
      },
    );
    return PaginationHelper.createResponse(
      content,
      total,
      Number(page),
      Number(size),
    );
  }

  @Get(':id/applications')
  @Permissions('application:view:all')
  async listExamApplications(
    @Param('id') examId: string,
    @Query('page') page = 0,
    @Query('size') size = 50,
    @Query('status') status?: string,
  ) {
    const parsedPage = Number(page);
    const parsedSize = Number(size);
    const { content, total } = await this.applicationService.listAll({
      examId,
      status,
      page: parsedPage,
      size: parsedSize,
    });
    return {
      success: true,
      data: {
        content,
        total,
        page: parsedPage,
        size: parsedSize,
      },
    };
  }

  @Get(':id/reviewers/available')
  @Permissions('exam:view')
  async listAvailableExamReviewers(
    @Param('id') examId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = resolveTenantIdFromRequest(req);
    const users = await this.examService.listAvailableReviewersForExam(
      examId,
      tenantId,
    );
    return ApiResult.ok(users);
  }

  @Get(':id/reviewers')
  @Permissions('exam:view')
  async listExamReviewers(@Param('id') examId: string) {
    const reviewers = await this.examService.listReviewers(examId);
    return ApiResult.ok(reviewers);
  }

  @Post(':id/reviewers')
  @Permissions('exam:edit')
  async addExamReviewer(
    @Param('id') examId: string,
    @Body() body: { userId?: string; role?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }
    if (
      body.role !== 'PRIMARY_REVIEWER' &&
      body.role !== 'SECONDARY_REVIEWER'
    ) {
      throw new BadRequestException(
        'role must be PRIMARY_REVIEWER or SECONDARY_REVIEWER',
      );
    }
    const tenantId = resolveTenantIdFromRequest(req);
    const created = await this.examService.addExamReviewer(
      examId,
      tenantId,
      body.userId,
      body.role,
    );
    return ApiResult.ok(created);
  }

  @Delete(':id/reviewers/:assignmentId')
  @Permissions('exam:edit')
  async removeExamReviewer(
    @Param('id') examId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    await this.examService.removeExamReviewerAssignment(examId, assignmentId);
    return ApiResult.ok(null, 'Reviewer removed');
  }

  @Post(':id/issue-tickets')
  @Permissions('ticket:batch-generate')
  async issueExamTickets(@Param('id') examId: string) {
    const exam = await this.examService.findById(examId);
    const batch = await this.ticketService.batchGenerateForExam(examId);
    const issued = batch.totalGenerated;
    const totalCandidates = issued + batch.alreadyExisted + batch.failed;
    return ApiResult.ok({
      totalCandidates,
      issued,
      notApproved: 0,
      failed: batch.failed,
      feeRequired: exam.feeRequired,
      message:
        issued > 0
          ? `已生成 ${issued} 条准考证`
          : batch.alreadyExisted > 0
            ? '考生已有准考证'
            : undefined,
    });
  }

  @Get(':id/ticket-number-rule')
  @Permissions('exam:view')
  async getTicketNumberRule(@Param('id') examId: string) {
    const rule = await this.ticketService.getTicketNumberRule(examId);
    return ApiResult.ok(rule);
  }

  @Put(':id/ticket-number-rule')
  @Permissions('exam:edit')
  async putTicketNumberRule(
    @Param('id') examId: string,
    @Body()
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
    const rule = await this.ticketService.upsertTicketNumberRule(examId, body);
    return ApiResult.ok(rule);
  }

  @Get(':id/scores')
  @Permissions('exam:view')
  async listExamScores(@Param('id') examId: string) {
    const scores = await this.scoreService.getScoresByExam(examId);
    return ApiResult.ok(scores);
  }

  @Get(':id/scores/statistics')
  @Permissions('exam:view')
  async examScoresStatistics(@Param('id') examId: string) {
    const stats = await this.scoreService.getStatistics(examId);
    return ApiResult.ok(stats);
  }

  @Get(':id')
  @Permissions('exam:view')
  async getById(@Param('id') id: string) {
    const exam = await this.examService.findById(id);
    return ApiResult.ok(exam);
  }

  @Post()
  @Permissions('exam:create')
  async create(
    @Body() request: ExamCreateRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const exam = await this.examService.create(request, req.user.userId);
    return ApiResult.ok(exam, 'Exam created successfully');
  }

  @Put(':id')
  @Permissions('exam:edit')
  async update(@Param('id') id: string, @Body() request: ExamUpdateRequest) {
    const exam = await this.examService.update(id, request);
    return ApiResult.ok(exam, 'Exam updated successfully');
  }

  @Delete(':id')
  @Permissions('exam:delete')
  async delete(@Param('id') id: string) {
    await this.examService.delete(id);
    return ApiResult.ok(null, 'Exam deleted successfully');
  }

  @Post(':id/open')
  @Permissions('exam:open')
  async open(@Param('id') id: string) {
    const exam = await this.examService.updateStatus(id, ExamStatus.OPEN);
    return ApiResult.ok(exam, 'Exam registration opened');
  }

  @Post(':id/close')
  @Permissions('exam:close')
  async close(@Param('id') id: string) {
    const exam = await this.examService.updateStatus(id, ExamStatus.CLOSED);
    return ApiResult.ok(exam, 'Exam registration closed');
  }

  // Position endpoints
  @Get(':id/positions')
  @Permissions('position:view')
  async getPositions(@Param('id') examId: string) {
    const positions = await this.positionService.findByExamId(examId);
    return ApiResult.ok(positions);
  }

  @Post('positions')
  @Permissions('position:create')
  async createPosition(@Body() request: PositionCreateRequest) {
    const position = await this.positionService.create(request);
    return ApiResult.ok(position, 'Position created successfully');
  }

  @Delete('positions/:id')
  @Permissions('position:delete')
  async deletePosition(@Param('id') id: string) {
    await this.positionService.delete(id);
    return ApiResult.ok(null, 'Position deleted successfully');
  }

  // Get all subjects for an exam (across all positions)
  @Get(':id/subjects')
  @Permissions('exam:view')
  async getExamSubjects(@Param('id') examId: string) {
    const positions = await this.positionService.findByExamId(examId);
    const allSubjects: Array<
      Subject & { positionId: string; positionTitle: string }
    > = [];
    for (const position of positions) {
      const subjects = await this.positionService.getSubjects(position.id);
      for (const subject of subjects) {
        allSubjects.push({
          ...subject,
          positionId: position.id,
          positionTitle: position.title,
        });
      }
    }
    return ApiResult.ok(allSubjects);
  }

  @Put('positions/:id')
  @Permissions('position:edit')
  async updatePosition(
    @Param('id') id: string,
    @Body() request: UpdatePositionRequest,
  ) {
    const position = await this.positionService.update(id, request);
    return ApiResult.ok(position, 'Position updated successfully');
  }

  // Subject endpoints
  @Get('positions/:positionId/subjects')
  @Permissions('position:view')
  async getSubjects(@Param('positionId') positionId: string) {
    const subjects = await this.positionService.getSubjects(positionId);
    return ApiResult.ok(subjects);
  }

  @Post('positions/:positionId/subjects')
  @Permissions('position:create')
  async createSubject(
    @Param('positionId') positionId: string,
    @Body() request: CreateSubjectRequest,
  ) {
    const subject = await this.positionService.createSubject(
      positionId,
      request,
    );
    return ApiResult.ok(subject, 'Subject created successfully');
  }

  @Put('subjects/:id')
  @Permissions('position:edit')
  async updateSubject(
    @Param('id') id: string,
    @Body() request: UpdateSubjectRequest,
  ) {
    const subject = await this.positionService.updateSubject(id, request);
    return ApiResult.ok(subject, 'Subject updated successfully');
  }

  @Delete('subjects/:id')
  @Permissions('position:delete')
  async deleteSubject(@Param('id') id: string) {
    await this.positionService.deleteSubject(id);
    return ApiResult.ok(null, 'Subject deleted successfully');
  }

  // Exam rules
  @Get(':id/rules')
  @Permissions('exam:view')
  async getExamRules(@Param('id') examId: string) {
    const rules = await this.examService.getExamRulesConfig(examId);
    return ApiResult.ok(rules);
  }

  @Put(':id/rules')
  @Permissions('exam:edit')
  async updateExamRules(
    @Param('id') examId: string,
    @Body() request: UpdateExamRulesRequest,
  ) {
    await this.examService.updateExamRules(examId, request);
    return ApiResult.ok(request, 'Exam rules updated');
  }

  // Position rules
  @Get('positions/:positionId/rules')
  @Permissions('position:view')
  async getPositionRules(@Param('positionId') positionId: string) {
    const position = await this.positionService.findById(positionId);
    return ApiResult.ok(position.rulesConfig ?? { rules: [] });
  }

  @Put('positions/:positionId/rules')
  @Permissions('position:edit')
  async updatePositionRules(
    @Param('positionId') positionId: string,
    @Body() request: UpdatePositionRulesRequest,
  ) {
    await this.positionService.update(positionId, {
      rulesConfig: request.rulesConfig as Prisma.InputJsonValue | undefined,
    });
    return ApiResult.ok(request, 'Position rules updated');
  }

  // Form template
  @Get(':id/form-template')
  @Permissions('exam:view')
  async getExamFormTemplate(@Param('id') examId: string) {
    const exam = await this.prisma.client.exam.findUnique({
      where: { id: examId },
      select: { formTemplate: true },
    });
    return ApiResult.ok(exam?.formTemplate || null);
  }

  @Put(':id/form-template/:templateId')
  @Permissions('exam:edit')
  async setExamFormTemplate(
    @Param('id') examId: string,
    @Param('templateId') templateId: string,
  ) {
    await this.examService.updateFormTemplate(examId, templateId);
    return ApiResult.ok({ templateId }, 'Form template set');
  }
}
