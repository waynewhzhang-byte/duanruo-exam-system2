import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /**
   * 查询报名的准考证
   * GET /tickets/application/:applicationId
   */
  @Get('application/:applicationId')
  @Permissions('ticket:view:own')
  async getByApplication(@Param('applicationId') applicationId: string) {
    // In a real scenario, should verify ownership or have TICKET_VIEW_ALL
    const result =
      await this.ticketService.findByApplicationId(applicationId);
    return ApiResult.ok(result);
  }

  /**
   * 批量生成准考证（管理员操作）
   * POST /tickets/batch-generate/:examId
   */
  @Post('batch-generate/:examId')
  @Permissions('ticket:batch-generate')
  async batchGenerate(@Param('examId') examId: string) {
    const result = await this.ticketService.batchGenerateForExam(examId);
    return ApiResult.ok(result);
  }
}
