import { Controller, Get } from '@nestjs/common';
import { ApiResult } from '../common/dto/api-result.dto';
import { ExamService } from './exam.service';

@Controller('published-exams')
export class PublishedExamController {
  constructor(private readonly examService: ExamService) {}

  @Get('open')
  async getOpenExams() {
    const exams = await this.examService.findOpenPublicExams();
    return ApiResult.ok(exams);
  }
}
