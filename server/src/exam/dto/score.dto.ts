import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordScoreDto {
  @IsString()
  applicationId: string;

  @IsString()
  subjectId: string;

  /** Filled from application when omitted (candidate UI / thin clients). */
  @IsOptional()
  @IsString()
  candidateId?: string;

  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BatchScoreDto {
  @IsString()
  applicationId: string;

  @IsString()
  subjectId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BatchImportDto {
  @IsString()
  examId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchScoreDto)
  scores: BatchScoreDto[];
}

export class CalculateEligibilityDto {
  @IsString()
  examId: string;

  @IsOptional()
  @IsNumber()
  passScore?: number;
}

export class UpdateInterviewResultDto {
  @IsString()
  applicationId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interviewScore?: number;

  @IsOptional()
  @IsString()
  finalResult?: string;

  @IsOptional()
  @IsString()
  interviewTime?: string;

  @IsOptional()
  @IsString()
  interviewLocation?: string;

  @IsOptional()
  @IsString()
  interviewRoom?: string;
}

/** Aggregated score stats for an exam (admin). */
export interface ScoreExamStatistics {
  totalCandidates: number;
  scoredCandidates: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  passRate: number;
}
