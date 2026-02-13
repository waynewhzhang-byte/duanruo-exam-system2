import { ReviewService } from './review.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { PullTaskRequest, DecisionTaskRequest } from './dto/review.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    pullTask(req: AuthenticatedRequest, request: PullTaskRequest): Promise<ApiResult<null> | ApiResult<{
        taskId: string;
        applicationId: string;
        stage: string;
        lockedUntil: Date;
    }>>;
    decide(req: AuthenticatedRequest, request: DecisionTaskRequest): Promise<ApiResult<{
        applicationId: string;
        fromStatus: string;
        toStatus: string;
    }>>;
    heartbeat(id: string, req: AuthenticatedRequest): Promise<ApiResult<{
        success: boolean;
    }>>;
    release(id: string, req: AuthenticatedRequest): Promise<ApiResult<{
        success: boolean;
    }>>;
    getQueue(examId: string, stage: string, status?: string, page?: number, size?: number): Promise<PaginatedResponse<any>>;
}
