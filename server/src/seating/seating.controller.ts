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
import { AllocateSeatsRequest } from './dto/seating.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('seating')
@UseGuards(JwtAuthGuard)
export class SeatingController {
  constructor(private readonly seatingService: SeatingService) {}

  @Post(':examId/allocate')
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
  async listAssignments(@Param('examId') examId: string) {
    const result = await this.seatingService.listAssignments(examId);
    return ApiResult.ok(result);
  }
}
