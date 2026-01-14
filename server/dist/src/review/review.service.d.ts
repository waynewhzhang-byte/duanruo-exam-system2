import { PrismaService } from '../prisma/prisma.service';
import { PullTaskRequest, DecisionTaskRequest } from './dto/review.dto';
export declare class ReviewService {
    private readonly prisma;
    private readonly logger;
    private readonly LOCK_TTL_MINUTES;
    constructor(prisma: PrismaService);
    private get client();
    pullNext(reviewerId: string, request: PullTaskRequest): Promise<{
        taskId: string;
        applicationId: string;
        stage: string;
        lockedUntil: Date;
    } | null>;
    decide(reviewerId: string, request: DecisionTaskRequest): Promise<{
        applicationId: string;
        fromStatus: string;
        toStatus: string;
    }>;
}
