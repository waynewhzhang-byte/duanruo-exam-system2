import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordScoreDto {
  @IsString()
  applicationId: string;

  @IsString()
  subjectId: string;

  @IsString()
  candidateId: string;

  @IsString()
  examId: string;

  @IsString()
  positionId: string;

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
