import { PrismaService } from '../prisma/prisma.service';
import { ExamService } from '../exam/exam.service';
import { SeatingService } from '../seating/seating.service';
export declare class ExamSchedulerService {
    private readonly prisma;
    private readonly examService;
    private readonly seatingService;
    private readonly logger;
    constructor(prisma: PrismaService, examService: ExamService, seatingService: SeatingService);
    closeExpiredRegistrations(): Promise<void>;
    runAutoSeating(): Promise<void>;
}
