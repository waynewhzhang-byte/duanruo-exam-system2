import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

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

export class ExamUpdateRequest extends ExamCreateRequest {
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
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
