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
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { PositionService } from './position.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExamCreateRequest, ExamUpdateRequest, ExamResponse } from './dto/exam.dto';
import { PositionCreateRequest } from './dto/position.dto';
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

@Controller('exams')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly positionService: PositionService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @Permissions('exam:view')
  async getAll(
    @Query('page') page = 0,
    @Query('size') size = 10,
    @Query('status') status?: string,
  ): Promise<PaginatedResponse<ExamResponse>> {
    const { content, total } = await this.examService.findAll(
      Number(page),
      Number(size),
      status,
    );
    return PaginationHelper.createResponse(
      content,
      total,
      Number(page),
      Number(size),
    );
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
    const exam = await this.examService.updateStatus(id, 'OPEN');
    return ApiResult.ok(exam, 'Exam registration opened');
  }

  @Post(':id/close')
  @Permissions('exam:close')
  async close(@Param('id') id: string) {
    const exam = await this.examService.updateStatus(id, 'CLOSED');
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
    const allSubjects: any[] = [];
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
    @Body() request: {
      title?: string;
      description?: string;
      requirements?: any;
      quota?: number;
    },
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
    @Body() request: {
      name: string;
      type: string;
      durationMinutes?: number;
      maxScore?: number;
      passingScore?: number;
      weight?: number;
      ordering?: number;
    },
  ) {
    const subject = await this.positionService.createSubject(positionId, request);
    return ApiResult.ok(subject, 'Subject created successfully');
  }

  @Put('subjects/:id')
  @Permissions('position:edit')
  async updateSubject(
    @Param('id') id: string,
    @Body() request: {
      name?: string;
      type?: string;
      durationMinutes?: number;
      maxScore?: number;
      passingScore?: number;
      weight?: number;
      ordering?: number;
    },
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
    const exam = await this.examService.findById(examId);
    return ApiResult.ok((exam as any)?.rulesConfig || { rules: [] });
  }

  @Put(':id/rules')
  @Permissions('exam:edit')
  async updateExamRules(
    @Param('id') examId: string,
    @Body() request: { rules?: any[] },
  ) {
    await (this.examService as any).updateExamRules(examId, request);
    return ApiResult.ok(request, 'Exam rules updated');
  }

  // Position rules
  @Get('positions/:positionId/rules')
  @Permissions('position:view')
  async getPositionRules(@Param('positionId') positionId: string) {
    const position = await this.positionService.findById(positionId);
    return ApiResult.ok((position as any)?.requirements || { rules: [] });
  }

  @Put('positions/:positionId/rules')
  @Permissions('position:edit')
  async updatePositionRules(
    @Param('positionId') positionId: string,
    @Body() request: { rulesConfig?: any },
  ) {
    await this.positionService.update(positionId, { requirements: request.rulesConfig as any });
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
    await (this.examService as any).updateFormTemplate(examId, templateId);
    return ApiResult.ok({ templateId }, 'Form template set');
  }
}
