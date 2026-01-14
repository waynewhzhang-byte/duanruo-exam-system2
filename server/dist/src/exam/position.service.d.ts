import { PrismaService } from '../prisma/prisma.service';
import { PositionCreateRequest, PositionResponse } from './dto/position.dto';
export declare class PositionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get client();
    findByExamId(examId: string): Promise<PositionResponse[]>;
    create(request: PositionCreateRequest): Promise<PositionResponse>;
    delete(id: string): Promise<void>;
    private mapToResponse;
}
