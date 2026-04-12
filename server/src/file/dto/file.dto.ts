import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
} from 'class-validator';

export class FileUploadUrlRequest {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  @IsOptional()
  fieldKey?: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number; // Optional - can be validated at step 1
}

export class FileConfimRequest {
  @IsNumber()
  @IsOptional()
  fileSize?: number; // Optional - can be auto-detected if not provided
}

export class FileUploadUrlResponse {
  fileId: string;
  uploadUrl: string;
  fileKey: string;
  fileName: string;
  contentType: string;
  fieldKey: string;
  expiresIn: number;
}

export class FileUploadConfirmResponse {
  fileId: string;
  status: string;
  originalName: string;
  fileSize: number;
  contentType: string;
  virusScanStatus: string;
  uploadedAt: Date;
  message: string;
}

export class FileInfoResponse {
  id: string;
  originalName: string;
  storedName: string;
  objectKey: string;
  contentType: string;
  fileSize: number;
  status: string;
  virusScanStatus: string;
  uploadedAt: Date;
}

export class PresignedUrlResponse {
  url: string;
  expiresIn: number;
}

export class FileBatchInfoRequest {
  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds: string[];
}

export class FileBatchInfoResponse {
  files: FileInfoResponse[];
  total: number;
  requestedBy: string;
  timestamp: Date;
}
