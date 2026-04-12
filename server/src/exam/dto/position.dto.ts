import type { Prisma } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectCreateRequest {
  @IsString()
  name: string;

  @IsNumber()
  durationMinutes: number;

  @IsString()
  type: string; // WRITTEN, INTERVIEW, PRACTICAL

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  ordering?: number;
}

export class PositionCreateRequest {
  @IsUUID()
  examId: string;

  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsNumber()
  quota?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectCreateRequest)
  subjects?: SubjectCreateRequest[];
}

export class SubjectResponse {
  id: string;
  name: string;
  durationMinutes: number;
  type: string;
  maxScore?: number;
  passingScore?: number;
  weight: number;
  ordering: number;
  createdAt: Date;
}

export class PositionResponse {
  id: string;
  examId: string;
  code: string;
  title: string;
  description?: string;
  requirements?: string;
  quota?: number;
  rulesConfig?: Prisma.JsonValue | null;
  subjects?: SubjectResponse[];
  createdAt: Date;
}
