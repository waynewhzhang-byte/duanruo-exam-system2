import { ExamService } from './exam.service';
import { PositionService } from './position.service';
import { ExamCreateRequest, ExamUpdateRequest } from './dto/exam.dto';
import { PositionCreateRequest } from './dto/position.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class ExamController {
    private readonly examService;
    private readonly positionService;
    constructor(examService: ExamService, positionService: PositionService);
    getAll(): Promise<ApiResult<import("./dto/exam.dto").ExamResponse[]>>;
    getById(id: string): Promise<ApiResult<import("./dto/exam.dto").ExamResponse>>;
    create(request: ExamCreateRequest, req: AuthenticatedRequest): Promise<ApiResult<import("./dto/exam.dto").ExamResponse>>;
    update(id: string, request: ExamUpdateRequest): Promise<ApiResult<import("./dto/exam.dto").ExamResponse>>;
    delete(id: string): Promise<ApiResult<null>>;
    open(id: string): Promise<ApiResult<import("./dto/exam.dto").ExamResponse>>;
    close(id: string): Promise<ApiResult<import("./dto/exam.dto").ExamResponse>>;
    getPositions(examId: string): Promise<ApiResult<import("./dto/position.dto").PositionResponse[]>>;
    createPosition(request: PositionCreateRequest): Promise<ApiResult<import("./dto/position.dto").PositionResponse>>;
    deletePosition(id: string): Promise<ApiResult<null>>;
}
