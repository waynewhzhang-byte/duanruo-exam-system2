import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  Min,
  Max,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AllocationStrategy {
  RANDOM = 'RANDOM',
  SUBMITTED_AT_FIRST = 'SUBMITTED_AT_FIRST',
  POSITION_FIRST_RANDOM = 'POSITION_FIRST_RANDOM',
  POSITION_FIRST_SUBMITTED_AT = 'POSITION_FIRST_SUBMITTED_AT',
  CUSTOM_GROUP = 'CUSTOM_GROUP',
}

export class AllocateSeatsRequest {
  @IsEnum(AllocationStrategy)
  strategy: AllocationStrategy;

  @IsOptional()
  @IsString()
  customGroupField?: string;
}

export class CreateVenueRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsUUID()
  examId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVenueRoomRequest)
  rooms?: CreateVenueRoomRequest[];
}

export class UpdateVenueRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class CreateVenueRoomRequest {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsInt()
  floor?: number;
}

export class CreateRoomRequest {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoomRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

/** Query for POST /seating/venues/:venueId/seat-map — matches SeatMapEditor */
export class CreateSeatMapQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  rows: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  columns: number;
}

export const SEAT_MAP_CELL_STATUSES = [
  'AVAILABLE',
  'UNAVAILABLE',
  'AISLE',
  'OCCUPIED',
] as const;

/** Query for PUT .../seat-map/seats/:row/:col/status */
export class UpdateSeatStatusQueryDto {
  @IsIn(SEAT_MAP_CELL_STATUSES)
  status: (typeof SEAT_MAP_CELL_STATUSES)[number];
}

/** Query for PUT .../seat-map/seats/:row/:col/label */
export class UpdateSeatLabelQueryDto {
  @IsString()
  label: string;
}

export class AssignSeatRequest {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  venueId: string;

  @IsInt()
  @Min(1)
  seatNo: number;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}

export class SeatAssignmentDetail {
  id: string;
  applicationId: string;
  candidateName: string;
  positionTitle: string;
  venueName: string;
  roomName: string;
  roomCode: string;
  seatNo: number;
  seatNumber: string;
  applicationStatus: string;
  assignedAt: Date;
}
