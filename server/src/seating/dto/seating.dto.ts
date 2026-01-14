import { IsString, IsEnum, IsOptional } from 'class-validator';

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
