import { ApplicationService } from './application.service';
import { ApplicationSubmitRequest } from './dto/application.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class ApplicationController {
    private readonly applicationService;
    constructor(applicationService: ApplicationService);
    getMyApplications(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationListItemResponse[]>>;
    getMyDrafts(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationListItemResponse[]>>;
    submit(request: ApplicationSubmitRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
    saveDraft(request: ApplicationSubmitRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
    getById(id: string): Promise<ApiResult<import("./dto/application.dto").ApplicationResponse>>;
}
