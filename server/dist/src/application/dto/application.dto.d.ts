export declare class AttachmentRef {
    fileId: string;
    fieldKey: string;
}
export declare class ApplicationSubmitRequest {
    examId: string;
    positionId: string;
    payload: Record<string, unknown>;
    formVersion?: number;
    attachments?: AttachmentRef[];
}
export declare class ApplicationResponse {
    id: string;
    examId: string;
    positionId: string;
    candidateId: string;
    formVersion: number;
    status: string;
    submittedAt?: Date;
    attachments?: AttachmentRef[];
}
export declare class ApplicationListItemResponse extends ApplicationResponse {
    examTitle?: string;
    positionTitle?: string;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    feeRequired: boolean;
    feeAmount: number;
}
