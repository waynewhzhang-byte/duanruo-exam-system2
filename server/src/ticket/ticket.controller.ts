import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  UsePipes,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiResponse } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import {
  GenerateTicketRequest,
  BatchGenerateTicketsRequest,
  ValidateTicketRequest,
  VerifyTicketRequest,
} from './dto/ticket.dto';
import type { Response } from 'express';
import { AtLeastOneTicketIdentifierPipe } from './pipes/at-least-one-ticket-identifier.pipe';

@Controller('tickets')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /**
   * Generate a single ticket for an application
   * POST /tickets
   */
  @Post()
  @Permissions('ticket:generate')
  async generate(@Body() dto: GenerateTicketRequest) {
    const ticketNo = await this.ticketService.generate(dto.applicationId);
    const tickets = await this.ticketService.findByApplicationId(
      dto.applicationId,
    );
    return ApiResponse.success(tickets[0] || { ticketNo });
  }

  /**
   * Query ticket by application
   * GET /tickets/application/:applicationId
   */
  @Get('application/:applicationId')
  @Permissions('ticket:view:own')
  async getByApplication(@Param('applicationId') applicationId: string) {
    const result = await this.ticketService.findByApplicationId(applicationId);
    return ApiResponse.success(result);
  }

  /**
   * Get my tickets (for candidate)
   * GET /tickets/my
   */
  @Get('my')
  @Permissions('ticket:view:own')
  async getMyTickets() {
    const result = await this.ticketService.findByCurrentUser();
    return ApiResponse.success(result);
  }

  /**
   * Download ticket as PDF
   * GET /tickets/:id/download
   */
  @Get(':id/download')
  @Permissions('ticket:view:own')
  async download(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.ticketService.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  /**
   * Batch generate tickets
   * POST /tickets/batch
   */
  @Post('batch')
  @Permissions('ticket:batch-generate')
  async batchGenerate(@Body() dto: BatchGenerateTicketsRequest) {
    const result = await this.ticketService.batchGenerate(dto.applicationIds);
    return ApiResponse.success({
      count: result.totalGenerated,
      ...result,
    });
  }

  /**
   * Validate ticket (lookup by number / QR / barcode; read-only)
   * POST /tickets/validate
   * Body matches web `TicketValidationRequest` / `TicketValidationRequestSchema`.
   */
  @Post('validate')
  @UsePipes(new AtLeastOneTicketIdentifierPipe())
  @Permissions('ticket:view')
  async validate(@Body() dto: ValidateTicketRequest) {
    const result = await this.ticketService.validateTicket(dto);
    return ApiResponse.success(result);
  }

  /**
   * Verify ticket at gate (marks verified)
   * POST /tickets/verify
   */
  @Post('verify')
  @Permissions('ticket:view')
  async verify(@Body() dto: VerifyTicketRequest) {
    const result = await this.ticketService.verifyTicket(dto);
    return ApiResponse.success(result);
  }

  /**
   * Batch generate tickets for an exam
   * POST /tickets/batch-generate/:examId
   */
  @Post('batch-generate/:examId')
  @Permissions('ticket:batch-generate')
  async batchGenerateForExam(@Param('examId') examId: string) {
    const result = await this.ticketService.batchGenerateForExam(examId);
    return ApiResponse.success(result);
  }

  /**
   * List tickets issued for an exam (admin)
   * GET /tickets/exam/:examId/list
   */
  @Get('exam/:examId/list')
  @Permissions('ticket:view')
  async listForExam(@Param('examId') examId: string) {
    const rows = await this.ticketService.listTicketsForExam(examId);
    return ApiResponse.success(rows);
  }

  @Get('exam/:examId/template')
  @Permissions('ticket:view')
  async getTicketTemplate(@Param('examId') examId: string) {
    const rule = await this.ticketService.getTicketNumberRule(examId);
    return ApiResponse.success({
      prefix: rule.prefix,
      dateFormat: rule.dateFormat,
      sequenceLength: rule.sequenceLength,
      separator: rule.separator,
      example: 'TEST-001-20260217-0001',
    });
  }

  @Put('exam/:examId/template')
  @Permissions('ticket:view')
  async saveTicketTemplate(
    @Param('examId') examId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const prefix =
      typeof body.customPrefix === 'string'
        ? body.customPrefix
        : typeof body.headerText === 'string'
          ? body.headerText
          : '';
    await this.ticketService.upsertTicketNumberRule(examId, { prefix });
    const rule = await this.ticketService.getTicketNumberRule(examId);
    return ApiResponse.success({
      prefix: rule.prefix,
      dateFormat: rule.dateFormat,
      sequenceLength: rule.sequenceLength,
      separator: rule.separator,
      example: 'TEST-001-20260217-0001',
    });
  }

  @Delete('exam/:examId/template')
  @Permissions('ticket:view')
  async resetTicketTemplate(@Param('examId') examId: string) {
    await this.ticketService.deleteTicketNumberRule(examId);
    return ApiResponse.success({ reset: true });
  }

  @Get('exam/:examId/statistics')
  @Permissions('ticket:view')
  getTicketStatistics(@Param('examId') examId: string) {
    return ApiResponse.success({
      examId,
      totalGenerated: 0,
      validCount: 0,
      usedCount: 0,
      expiredCount: 0,
      cancelledCount: 0,
      revokedCount: 0,
      byPosition: [] as Array<{
        positionId: string;
        positionName: string;
        count: number;
      }>,
      bySubject: [] as Array<{
        subjectId: string;
        subjectName: string;
        count: number;
      }>,
      byVenue: [] as Array<{
        venueId: string;
        venueName: string;
        count: number;
      }>,
    });
  }

  /**
   * Ticket detail by id (must stay after all `exam/...` routes)
   * GET /tickets/:id
   */
  @Get(':id')
  @Permissions('ticket:view')
  async getById(@Param('id') id: string) {
    const row = await this.ticketService.findById(id);
    return ApiResponse.success(row);
  }
}
