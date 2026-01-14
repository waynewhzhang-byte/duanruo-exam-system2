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
}
