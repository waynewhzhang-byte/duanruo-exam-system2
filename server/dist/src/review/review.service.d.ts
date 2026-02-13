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
    getByApplicationId(applicationId: string): Promise<{
        id: string;
        createdAt: Date;
        applicationId: string;
        stage: string;
        reviewerId: string;
        decision: string | null;
        comment: string | null;
        reviewedAt: Date | null;
    }[]>;
    heartbeat(taskId: string, reviewerId: string): Promise<{
        success: boolean;
    }>;
    release(taskId: string, reviewerId: string): Promise<{
        success: boolean;
    }>;
    getQueue(params: {
        examId: string;
        stage: string;
        status?: string;
        page: number;
        size: number;
    }): Promise<{
        content: {
            id: string;
            status: string;
            createdAt: Date;
            applicationId: string;
            stage: string;
            assignedTo: string | null;
            lockedAt: Date | null;
            lastHeartbeatAt: Date | null;
        }[];
        total: number;
    }>;
}
