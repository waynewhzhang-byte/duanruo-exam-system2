export declare enum ReviewStage {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY"
}
export declare class ReviewDecisionRequest {
    applicationId: string;
    newStatus: string;
    decision?: string;
    stage?: string;
    evidenceFileIds?: string[];
}
export declare class BatchReviewRequest {
    applicationIds: string[];
    approve: boolean;
    reason?: string;
}
export declare class PullTaskRequest {
    examId: string;
    stage: ReviewStage;
    preferredPositionId?: string;
}
export declare class DecisionTaskRequest {
    taskId: string;
    approve: boolean;
    reason?: string;
    evidenceFileIds?: string[];
}
