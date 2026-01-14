export declare class SubjectCreateRequest {
    name: string;
    durationMinutes: number;
    type: string;
    maxScore?: number;
    passingScore?: number;
    weight?: number;
    ordering?: number;
}
export declare class PositionCreateRequest {
    examId: string;
    code: string;
    title: string;
    description?: string;
    requirements?: string;
    quota?: number;
    subjects?: SubjectCreateRequest[];
}
export declare class SubjectResponse {
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
export declare class PositionResponse {
    id: string;
    examId: string;
    code: string;
    title: string;
    description?: string;
    requirements?: string;
    quota?: number;
    subjects?: SubjectResponse[];
    createdAt: Date;
}
