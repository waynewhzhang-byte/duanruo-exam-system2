import { ApplicationService } from './application.service';
import { ReviewService } from '../review/review.service';
import { ApplicationSubmitRequest } from './dto/application.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class ApplicationController {
    private readonly applicationService;
    private readonly reviewService;
    constructor(applicationService: ApplicationService, reviewService: ReviewService);
    getMyApplications(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationListItemResponse[]>>;
    getMyDrafts(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationListItemResponse[]>>;
    submit(request: ApplicationSubmitRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
    saveDraft(request: ApplicationSubmitRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
    getById(id: string): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
    getReviews(id: string): Promise<ApiResult<{
        id: string;
        createdAt: Date;
        applicationId: string;
        stage: string;
        reviewerId: string;
        decision: string | null;
        comment: string | null;
        reviewedAt: Date | null;
    }[]>>;
}
