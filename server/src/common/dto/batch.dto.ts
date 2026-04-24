import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchOperationItem<T = string> {
  @IsOptional()
  id?: T;
}

export class BatchResult<T = string> {
  success: T[];
  failed: { id: T; reason: string }[];
}

export class IdsBatchRequest {
  @IsArray()
  ids: string[];
}

export class IdWithReason {
  @IsUUID('4')
  id: string;

  @IsBoolean()
  decision: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BatchReviewDecisionRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdWithReason)
  decisions: IdWithReason[];
}

export class BatchTicketGenerateRequest {
  @IsArray()
  applicationIds: string[];
}

export class BatchSeatAssignRequest {
  examId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatAssignItem)
  assignments: SeatAssignItem[];
}

export class SeatAssignItem {
  applicationId: string;
  venueId: string;
  roomId?: string;
  seatNo: number;
}

export class BatchStatusUpdateRequest {
  @IsArray()
  items: { id: string; status: string }[];
}

export class BatchDeleteResult {
  deleted: string[];
  failed: { id: string; reason: string }[];
}
