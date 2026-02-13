import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SeatingService } from './seating.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { AllocateSeatsRequest } from './dto/seating.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('seating')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class SeatingController {
  constructor(private readonly seatingService: SeatingService) { }

  @Post(':examId/allocate')
  @Permissions('seating:allocate')
  async allocate(
    @Param('examId') examId: string,
    @Body() request: AllocateSeatsRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const result = await this.seatingService.allocate(examId, request, userId);
    return ApiResult.ok(result);
  }

  @Get(':examId/assignments')
  @Permissions('seating:view')
  async listAssignments(@Param('examId') examId: string) {
    const result = await this.seatingService.listAssignments(examId);
    return ApiResult.ok(result);
  }
}
