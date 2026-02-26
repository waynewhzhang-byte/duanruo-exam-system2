import { Controller, Get, Post, Param, Body, UseGuards, Res } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiResponse } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { Response } from 'express';

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
  async generate(@Body() dto: { applicationId: string }) {
    const ticketNo = await this.ticketService.generate(dto.applicationId);
    const tickets = await this.ticketService.findByApplicationId(dto.applicationId);
    return ApiResponse.success(tickets[0] || { ticketNo });
  }

  /**
   * Query ticket by application
   * GET /tickets/application/:applicationId
   */
  @Get('application/:applicationId')
  @Permissions('ticket:view:own')
  async getByApplication(@Param('applicationId') applicationId: string) {
    const result =
      await this.ticketService.findByApplicationId(applicationId);
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
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
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
  async batchGenerate(@Body() dto: { applicationIds: string[] }) {
    const result = await this.ticketService.batchGenerate(dto.applicationIds);
    return ApiResponse.success({
      count: result.totalGenerated,
      ...result,
    });
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

  @Get('exam/:examId/template')
  @Permissions('ticket:view')
  async getTicketTemplate(@Param('examId') examId: string) {
    return ApiResponse.success({
      prefix: '',
      dateFormat: 'YYYYMMDD',
      sequenceLength: 4,
      separator: '-',
      example: 'TEST-001-20260217-0001',
    });
  }

  @Get('exam/:examId/statistics')
  @Permissions('ticket:view')
  async getTicketStatistics(@Param('examId') examId: string) {
    return ApiResponse.success({
      totalTickets: 0,
      issuedTickets: 0,
      downloadedTickets: 0,
    });
  }
}
