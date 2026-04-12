import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import type { Prisma } from '@prisma/client';

export class ExamCreateRequest {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  announcement?: string;

  @IsOptional()
  @IsDateString()
  registrationStart?: string;

  @IsOptional()
  @IsDateString()
  registrationEnd?: string;

  @IsOptional()
  @IsDateString()
  examStart?: string;

  @IsOptional()
  @IsDateString()
  examEnd?: string;

  @IsOptional()
  @IsBoolean()
  feeRequired?: boolean;

  @IsOptional()
  @IsNumber()
  feeAmount?: number;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class ExamUpdateRequest {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  announcement?: string;

  @IsOptional()
  @IsDateString()
  registrationStart?: string;

  @IsOptional()
  @IsDateString()
  registrationEnd?: string;

  @IsOptional()
  @IsDateString()
  examStart?: string;

  @IsOptional()
  @IsDateString()
  examEnd?: string;

  @IsOptional()
  @IsBoolean()
  feeRequired?: boolean;

  @IsOptional()
  @IsNumber()
  feeAmount?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ExamResponse {
  id: string;
  code: string;
  title: string;
  description?: string;
  announcement?: string;
  registrationStart?: Date;
  registrationEnd?: Date;
  examStart?: Date;
  examEnd?: Date;
  feeRequired: boolean;
  feeAmount?: number;
  status: string;
  formTemplate?: Prisma.JsonValue | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregated exam application statistics (admin dashboard). */
export interface ExamStatistics {
  examId: string;
  examCode: string;
  examTitle: string;
  totalApplications: number;
  draftApplications: number;
  submittedApplications: number;
  pendingPrimaryReviewApplications: number;
  primaryPassedApplications: number;
  primaryRejectedApplications: number;
  pendingSecondaryReviewApplications: number;
  approvedApplications: number;
  secondaryRejectedApplications: number;
  paidApplications: number;
  ticketIssuedApplications: number;
  primaryApprovalRate: number;
  secondaryApprovalRate: number;
  overallApprovalRate: number;
}
