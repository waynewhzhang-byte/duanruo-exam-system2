import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentRequest, PaymentCallbackRequest } from './dto/payment.dto';
export declare class PaymentService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private get client();
    initiate(request: InitiatePaymentRequest): Promise<{
        orderId: string;
        outTradeNo: string;
        payUrl: string;
        status: string;
    }>;
    handleCallback(request: PaymentCallbackRequest): Promise<{
        success: boolean;
        status: string;
    } | {
        success: boolean;
        message: string;
    }>;
}
