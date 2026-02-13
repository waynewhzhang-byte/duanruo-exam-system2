import { ExamService } from './exam.service';
import { PositionService } from './position.service';
import { ExamCreateRequest, ExamUpdateRequest, ExamResponse } from './dto/exam.dto';
import { PositionCreateRequest } from './dto/position.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class ExamController {
    private readonly examService;
    private readonly positionService;
    constructor(examService: ExamService, positionService: PositionService);
    getAll(page?: number, size?: number, status?: string): Promise<PaginatedResponse<ExamResponse>>;
    getById(id: string): Promise<ApiResult<ExamResponse>>;
    create(request: ExamCreateRequest, req: AuthenticatedRequest): Promise<ApiResult<ExamResponse>>;
    update(id: string, request: ExamUpdateRequest): Promise<ApiResult<ExamResponse>>;
    delete(id: string): Promise<ApiResult<null>>;
    open(id: string): Promise<ApiResult<ExamResponse>>;
    close(id: string): Promise<ApiResult<ExamResponse>>;
    getPositions(examId: string): Promise<ApiResult<import("./dto/position.dto").PositionResponse[]>>;
    createPosition(request: PositionCreateRequest): Promise<ApiResult<import("./dto/position.dto").PositionResponse>>;
    deletePosition(id: string): Promise<ApiResult<null>>;
}
