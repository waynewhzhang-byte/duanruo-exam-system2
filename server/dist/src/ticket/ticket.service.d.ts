import { PrismaService } from '../prisma/prisma.service';
import { TicketResponse } from './dto/ticket.dto';
export declare class TicketService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private get client();
    generate(applicationId: string): Promise<string>;
    findByApplicationId(applicationId: string): Promise<TicketResponse[]>;
    batchGenerateForExam(examId: string): Promise<{
        totalGenerated: number;
        alreadyExisted: number;
        failed: number;
        ticketNos: string[];
    }>;
}
