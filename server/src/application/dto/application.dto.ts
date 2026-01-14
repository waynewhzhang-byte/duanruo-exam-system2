import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentRef {
  @IsUUID()
  fileId: string;

  @IsString()
  fieldKey: string;
}

export class ApplicationSubmitRequest {
  @IsUUID()
  examId: string;

  @IsUUID()
  positionId: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  formVersion?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentRef)
  attachments?: AttachmentRef[];
}

export class ApplicationResponse {
  id: string;
  examId: string;
  positionId: string;
  candidateId: string;
  formVersion: number;
  status: string;
  submittedAt?: Date;
  attachments?: AttachmentRef[];
}

export class ApplicationListItemResponse extends ApplicationResponse {
  examTitle?: string;
  positionTitle?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  feeRequired: boolean;
  feeAmount: number;
}
