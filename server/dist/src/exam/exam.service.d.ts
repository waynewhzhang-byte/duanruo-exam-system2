import { PrismaService } from '../prisma/prisma.service';
import { ExamCreateRequest, ExamUpdateRequest, ExamResponse } from './dto/exam.dto';
export declare class ExamService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get client();
    findAll(): Promise<ExamResponse[]>;
    findById(id: string): Promise<ExamResponse>;
    findByCode(code: string): Promise<ExamResponse>;
    create(request: ExamCreateRequest, userId: string): Promise<ExamResponse>;
    update(id: string, request: ExamUpdateRequest): Promise<ExamResponse>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: string): Promise<ExamResponse>;
    private mapToResponse;
}
