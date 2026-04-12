import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePositionRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  requirements?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  quota?: number;
}

export class CreateSubjectRequest {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  passingScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordering?: number;

  /** 考试时间（前端 datetime-local 转成的 `yyyy-MM-dd HH:mm:ss` 字符串），写入 subjects.schedule (jsonb) */
  @IsOptional()
  @IsString()
  schedule?: string;
}

export class UpdateSubjectRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  maxScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  passingScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordering?: number;

  @IsOptional()
  @IsString()
  schedule?: string;
}

export class UpdateExamRulesRequest {
  @IsOptional()
  @IsArray()
  rules?: Record<string, unknown>[];
}

export class UpdatePositionRulesRequest {
  @IsOptional()
  rulesConfig?: Record<string, unknown>;
}
