import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { SeatingService } from './seating.service';
import { ApiResponse } from '../common/dto/api-response.dto';
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

  @Get('venues')
  @Permissions('seating:view')
  async listVenues(@Query('examId') examId?: string) {
    const venues = await this.seatingService.listVenues(examId);
    return ApiResponse.success(venues);
  }

  @Get('venues/:id')
  @Permissions('seating:view')
  async getVenue(@Param('id') id: string) {
    const venue = await this.seatingService.getVenue(id);
    return ApiResponse.success(venue);
  }

  @Post('venues')
  @Permissions('seating:create')
  async createVenue(@Body() data: any) {
    const venue = await this.seatingService.createVenue(data);
    return ApiResponse.success(venue);
  }

  // Room management endpoints
  @Get('venues/:venueId/rooms')
  @Permissions('seating:view')
  async listRooms(@Param('venueId') venueId: string) {
    const rooms = await this.seatingService.listRooms(venueId);
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    return ApiResponse.success({ items: rooms, total: rooms.length, totalCapacity });
  }

  @Post('venues/:venueId/rooms')
  @Permissions('seating:create')
  async createRoom(@Param('venueId') venueId: string, @Body() data: any) {
    const room = await this.seatingService.createRoom(venueId, data);
    return ApiResponse.success(room);
  }

  @Put('rooms/:roomId')
  @Permissions('seating:edit')
  async updateRoom(@Param('roomId') roomId: string, @Body() data: any) {
    const room = await this.seatingService.updateRoom(roomId, data);
    return ApiResponse.success(room);
  }

  @Delete('rooms/:roomId')
  @Permissions('seating:delete')
  async deleteRoom(@Param('roomId') roomId: string) {
    await this.seatingService.deleteRoom(roomId);
    return ApiResponse.success(null, 'Room deleted');
  }

  @Post(':examId/allocate')
  @Permissions('seating:allocate')
  async allocate(
    @Param('examId') examId: string,
    @Body() request: AllocateSeatsRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const result = await this.seatingService.allocate(examId, request, userId);
    return ApiResponse.success(result);
  }

  @Get(':examId/assignments')
  @Permissions('seating:view')
  async listAssignments(@Param('examId') examId: string) {
    const result = await this.seatingService.listAssignments(examId);
    return ApiResponse.success(result);
  }

  @Post('assign')
  @Permissions('seating:allocate')
  async assignSeat(
    @Body() dto: { applicationId: string; venueId: string; seatNo: number; roomId?: string },
  ) {
    const result = await this.seatingService.assignSeat(
      dto.applicationId,
      dto.venueId,
      dto.seatNo,
      dto.roomId,
    );
    return ApiResponse.success(result);
  }
}
