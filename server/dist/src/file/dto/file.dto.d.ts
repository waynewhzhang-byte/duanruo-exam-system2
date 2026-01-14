export declare class FileUploadUrlRequest {
    fileName: string;
    contentType: string;
    fieldKey?: string;
    applicationId?: string;
}
export declare class FileConfimRequest {
    fileSize: number;
}
export declare class FileUploadUrlResponse {
    fileId: string;
    uploadUrl: string;
    fileKey: string;
    fileName: string;
    contentType: string;
    fieldKey: string;
    expiresIn: number;
}
export declare class FileUploadConfirmResponse {
    fileId: string;
    status: string;
    originalName: string;
    fileSize: number;
    contentType: string;
    virusScanStatus: string;
    uploadedAt: Date;
    message: string;
}
export declare class FileInfoResponse {
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
export declare class PresignedUrlResponse {
    url: string;
    expiresIn: number;
}
export declare class FileBatchInfoRequest {
    fileIds: string[];
}
export declare class FileBatchInfoResponse {
    files: FileInfoResponse[];
    total: number;
    requestedBy: string;
    timestamp: Date;
}
