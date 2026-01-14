import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

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
}

export class FileConfimRequest {
  @IsNumber()
  fileSize: number;
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
  fileIds: string[];
}

export class FileBatchInfoResponse {
  files: FileInfoResponse[];
  total: number;
  requestedBy: string;
  timestamp: Date;
}
