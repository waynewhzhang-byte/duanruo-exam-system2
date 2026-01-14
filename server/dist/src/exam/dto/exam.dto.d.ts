export declare class ExamCreateRequest {
    code: string;
    title: string;
    description?: string;
    announcement?: string;
    registrationStart?: string;
    registrationEnd?: string;
    examStart?: string;
    examEnd?: string;
    feeRequired?: boolean;
    feeAmount?: number;
    slug?: string;
}
export declare class ExamUpdateRequest extends ExamCreateRequest {
    status?: string;
}
export declare class ExamResponse {
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
