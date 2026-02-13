import { PrismaService } from '../prisma/prisma.service';
export declare class ExamSchedulerService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    closeExpiredRegistrations(): Promise<void>;
    runAutoSeating(): Promise<void>;
}
