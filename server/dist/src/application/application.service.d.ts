import { PrismaService } from '../prisma/prisma.service';
import { AutoReviewService } from '../review/auto-review.service';
import { ApplicationSubmitRequest, ApplicationResponse, ApplicationListItemResponse } from './dto/application.dto';
export declare class ApplicationService {
    private readonly prisma;
    private readonly autoReviewService;
    private readonly logger;
    constructor(prisma: PrismaService, autoReviewService: AutoReviewService);
    private get client();
    submit(candidateId: string, request: ApplicationSubmitRequest): Promise<ApplicationResponse>;
    private triggerAutoReview;
    saveDraft(candidateId: string, request: ApplicationSubmitRequest): Promise<ApplicationResponse>;
    listMyEnriched(candidateId: string): Promise<ApplicationListItemResponse[]>;
    listMyDrafts(candidateId: string): Promise<ApplicationListItemResponse[]>;
    findById(id: string): Promise<ApplicationResponse>;
    private mapToResponse;
}
