import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ScoreService } from './score.service';
import {
  RecordScoreDto,
  BatchImportDto,
  UpdateInterviewResultDto,
} from './dto/score.dto';

@Controller('scores')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get('exam/:examId')
  @Permissions('exam:view')
  async getScoresByExam(@Param('examId', ParseUUIDPipe) examId: string) {
    const scores = await this.scoreService.getScoresByExam(examId);
    return ApiResult.ok(scores);
  }

  @Get('application/:applicationId')
  async getScoresByApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const app = await this.scoreService.getApplicationForAuth(applicationId);
    const canView =
      req.user.userId === app.candidateId ||
      req.user.permissions?.includes('exam:view');
    if (!canView) {
      throw new ForbiddenException('No permission to view these scores');
    }
    const scores =
      await this.scoreService.getScoresByApplication(applicationId);
    return ApiResult.ok(scores);
  }

  @Post('record')
  @Permissions('exam:edit')
  async recordScore(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RecordScoreDto,
  ) {
    const score = await this.scoreService.recordScore(req.user.userId, dto);
    return ApiResult.ok(score, '成绩录入成功');
  }

  @Post('batch-import')
  @Permissions('exam:edit')
  async batchImport(
    @Request() req: AuthenticatedRequest,
    @Body() dto: BatchImportDto,
  ) {
    const result = await this.scoreService.batchImportScores(
      req.user.userId,
      dto.examId,
      dto.scores,
    );
    return ApiResult.ok(result, '成绩导入完成');
  }

  @Post('calculate-eligibility/:examId')
  @Permissions('exam:edit')
  async calculateEligibility(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Query('passScore') passScore?: string,
  ) {
    const result = await this.scoreService.batchCalculateEligibility(
      examId,
      passScore ? parseFloat(passScore) : undefined,
    );
    return ApiResult.ok(result, '面试资格计算完成');
  }

  @Post('interview-result')
  @Permissions('exam:edit')
  async updateInterviewResult(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateInterviewResultDto,
  ) {
    const result = await this.scoreService.updateInterviewResult(
      req.user.userId,
      dto,
    );
    return ApiResult.ok(result, '面试结果更新成功');
  }

  @Get('statistics/:examId')
  @Permissions('exam:view')
  async getStatistics(@Param('examId', ParseUUIDPipe) examId: string) {
    const stats = await this.scoreService.getStatistics(examId);
    return ApiResult.ok(stats);
  }

  @Get('ranking/exam/:examId')
  @Permissions('exam:view')
  async getRanking(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Query('positionId') positionId?: string,
  ) {
    const rows = await this.scoreService.getExamRanking(examId, positionId);
    return ApiResult.ok(rows);
  }

  @Get('export/:examId')
  @Permissions('exam:view')
  async exportScores(@Param('examId', ParseUUIDPipe) examId: string) {
    const data = await this.scoreService.exportScores(examId);
    return ApiResult.ok(data);
  }

  @Get('template/:examId')
  @Permissions('exam:edit')
  async getImportTemplate(@Param('examId', ParseUUIDPipe) examId: string) {
    const csv = await this.scoreService.generateImportTemplate(examId);
    return ApiResult.ok(csv);
  }

  @Delete(':scoreId')
  @Permissions('exam:edit')
  async deleteScore(@Param('scoreId', ParseUUIDPipe) scoreId: string) {
    await this.scoreService['prisma'].examScore.delete({
      where: { id: scoreId },
    });
    return ApiResult.ok(null, '成绩删除成功');
  }
}
