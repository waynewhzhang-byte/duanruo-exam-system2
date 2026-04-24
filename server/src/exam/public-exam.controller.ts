import { Controller, Get, Param } from '@nestjs/common';
import { ApiResult } from '../common/dto/api-result.dto';
import { ExamService } from './exam.service';

@Controller('public/exams')
export class PublicExamController {
  constructor(private readonly examService: ExamService) {}

  @Get('open')
  async getOpenExams() {
    const exams = await this.examService.findOpenPublicExams();
    return ApiResult.ok(exams);
  }

  @Get('tenant/:tenantCode/code/:code')
  async getExamByTenantAndCode(
    @Param('tenantCode') tenantCode: string,
    @Param('code') code: string,
  ) {
    const exam = await this.examService.findPublicExamByTenantAndCode(
      tenantCode,
      code,
    );
    return ApiResult.ok(exam);
  }

  @Get('tenant/:tenantCode/code/:code/positions')
  async getExamPositionsByTenantAndCode(
    @Param('tenantCode') tenantCode: string,
    @Param('code') code: string,
  ) {
    const positions = await this.examService.findPublicExamPositions(
      tenantCode,
      code,
    );
    return ApiResult.ok(positions);
  }

  @Get('tenant/:tenantCode/code/:code/announcement')
  async getAnnouncementByTenantAndCode(
    @Param('tenantCode') tenantCode: string,
    @Param('code') code: string,
  ) {
    const announcement = await this.examService.findPublicExamAnnouncement(
      tenantCode,
      code,
    );
    return ApiResult.ok(announcement);
  }
}
