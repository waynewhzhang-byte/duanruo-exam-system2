import { PrismaService } from '../prisma/prisma.service';
import { AllocateSeatsRequest, SeatAssignmentDetail } from './dto/seating.dto';
export declare class SeatingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private get client();
    allocate(examId: string, request: AllocateSeatsRequest, userId: string): Promise<{
        batchId: string;
        totalCandidates: number;
        totalAssigned: number;
        totalVenues: number;
        ticketsUpdated: number;
    }>;
    listAssignments(examId: string): Promise<SeatAssignmentDetail[]>;
}
