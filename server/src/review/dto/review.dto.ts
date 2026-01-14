import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum ReviewStage {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export class ReviewDecisionRequest {
  @IsUUID()
  applicationId: string;

  @IsString()
  newStatus: string;

  @IsOptional()
  @IsString()
  decision?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceFileIds?: string[];
}

export class BatchReviewRequest {
  @IsArray()
  @IsUUID('4', { each: true })
  applicationIds: string[];

  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PullTaskRequest {
  @IsUUID()
  examId: string;

  @IsEnum(ReviewStage)
  stage: ReviewStage;

  @IsOptional()
  @IsUUID()
  preferredPositionId?: string;
}

export class DecisionTaskRequest {
  @IsUUID()
  taskId: string;

  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidenceFileIds?: string[];
}
