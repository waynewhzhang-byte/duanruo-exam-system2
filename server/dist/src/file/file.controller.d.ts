import { FileService } from './file.service';
import { FileUploadUrlRequest, FileConfimRequest, FileBatchInfoRequest, FileInfoResponse, FileUploadConfirmResponse } from './dto/file.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class FileController {
    private readonly fileService;
    private readonly logger;
    constructor(fileService: FileService);
    getUploadUrl(request: FileUploadUrlRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/file.dto").FileUploadUrlResponse>>;
    confirmUpload(id: string, request: FileConfimRequest, req: AuthenticatedRequest): Promise<ApiResult<FileUploadConfirmResponse>>;
    getDownloadUrl(id: string, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/file.dto").PresignedUrlResponse>>;
    getBatchInfo(request: FileBatchInfoRequest): Promise<ApiResult<import("./dto/file.dto").FileBatchInfoResponse>>;
    getFileInfo(id: string): Promise<ApiResult<FileInfoResponse>>;
}
