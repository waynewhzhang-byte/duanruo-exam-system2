import { PrismaService } from '../prisma/prisma.service';
import { ApplicationSubmitRequest, ApplicationResponse, ApplicationListItemResponse } from './dto/application.dto';
export declare class ApplicationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get client();
    submit(candidateId: string, request: ApplicationSubmitRequest): Promise<ApplicationResponse>;
    saveDraft(candidateId: string, request: ApplicationSubmitRequest): Promise<ApplicationResponse>;
    listMyEnriched(candidateId: string): Promise<ApplicationListItemResponse[]>;
    listMyDrafts(candidateId: string): Promise<ApplicationListItemResponse[]>;
    findById(id: string): Promise<ApplicationResponse>;
    private mapToResponse;
}
