import { SeatingService } from './seating.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { AllocateSeatsRequest } from './dto/seating.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class SeatingController {
    private readonly seatingService;
    constructor(seatingService: SeatingService);
    allocate(examId: string, request: AllocateSeatsRequest, req: AuthenticatedRequest): Promise<ApiResult<{
        batchId: string;
        totalCandidates: number;
        totalAssigned: number;
        totalVenues: number;
    }>>;
    listAssignments(examId: string): Promise<ApiResult<import("./dto/seating.dto").SeatAssignmentDetail[]>>;
}
