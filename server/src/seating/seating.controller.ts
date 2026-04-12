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
import {
  AllocateSeatsRequest,
  CreateVenueRequest,
  UpdateVenueRequest,
  CreateRoomRequest,
  UpdateRoomRequest,
  AssignSeatRequest,
  CreateSeatMapQueryDto,
  UpdateSeatStatusQueryDto,
  UpdateSeatLabelQueryDto,
} from './dto/seating.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('seating')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class SeatingController {
  constructor(private readonly seatingService: SeatingService) {}

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

  /** Alias for frontend: GET /seating/venues/:venueId/seat-map */
  @Get('venues/:venueId/seat-map')
  @Permissions('seating:view')
  async getSeatMap(@Param('venueId') venueId: string) {
    const venue = await this.seatingService.getVenue(venueId);
    return ApiResponse.success({
      venueId: venue.id,
      seatMapJson: venue.seatMapJson ?? null,
      rooms: venue.rooms,
    });
  }

  /** Create grid seat map (SeatMapEditor) */
  @Post('venues/:venueId/seat-map')
  @Permissions('seating:edit')
  async createSeatMap(
    @Param('venueId') venueId: string,
    @Query() query: CreateSeatMapQueryDto,
  ) {
    const data = await this.seatingService.createSeatMapGrid(
      venueId,
      query.rows,
      query.columns,
    );
    return ApiResponse.success(data);
  }

  @Put('venues/:venueId/seat-map/seats/:row/:col/status')
  @Permissions('seating:edit')
  async updateSeatMapSeatStatus(
    @Param('venueId') venueId: string,
    @Param('row') rowStr: string,
    @Param('col') colStr: string,
    @Query() query: UpdateSeatStatusQueryDto,
  ) {
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    const data = await this.seatingService.updateSeatMapSeatStatus(
      venueId,
      row,
      col,
      query.status,
    );
    return ApiResponse.success(data);
  }

  @Put('venues/:venueId/seat-map/seats/:row/:col/label')
  @Permissions('seating:edit')
  async updateSeatMapSeatLabel(
    @Param('venueId') venueId: string,
    @Param('row') rowStr: string,
    @Param('col') colStr: string,
    @Query() query: UpdateSeatLabelQueryDto,
  ) {
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    const data = await this.seatingService.updateSeatMapSeatLabel(
      venueId,
      row,
      col,
      query.label,
    );
    return ApiResponse.success(data);
  }

  @Post('venues')
  @Permissions('seating:create')
  async createVenue(@Body() data: CreateVenueRequest) {
    const venue = await this.seatingService.createVenue(data);
    return ApiResponse.success(venue);
  }

  @Put('venues/:id')
  @Permissions('seating:edit')
  async updateVenue(@Param('id') id: string, @Body() data: UpdateVenueRequest) {
    const venue = await this.seatingService.updateVenue(id, data);
    return ApiResponse.success(venue);
  }

  @Delete('venues/:id')
  @Permissions('seating:delete')
  async deleteVenue(@Param('id') id: string) {
    await this.seatingService.deleteVenue(id);
    return ApiResponse.success(null, 'Venue deleted');
  }

  @Get('venues/:venueId/rooms')
  @Permissions('seating:view')
  async listRooms(@Param('venueId') venueId: string) {
    const rooms = await this.seatingService.listRooms(venueId);
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    return ApiResponse.success({
      items: rooms,
      total: rooms.length,
      totalCapacity,
    });
  }

  @Post('venues/:venueId/rooms')
  @Permissions('seating:create')
  async createRoom(
    @Param('venueId') venueId: string,
    @Body() data: CreateRoomRequest,
  ) {
    const room = await this.seatingService.createRoom(venueId, data);
    return ApiResponse.success(room);
  }

  @Put('rooms/:roomId')
  @Permissions('seating:edit')
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body() data: UpdateRoomRequest,
  ) {
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
  async assignSeat(@Body() dto: AssignSeatRequest) {
    const result = await this.seatingService.assignSeat(
      dto.applicationId,
      dto.venueId,
      dto.seatNo,
      dto.roomId,
    );
    return ApiResponse.success(result);
  }
}
