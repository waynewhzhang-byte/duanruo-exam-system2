import { PrismaService } from '../prisma/prisma.service';
import { MockGatewayService } from './mock-gateway.service';
import { InitiatePaymentRequest, PaymentCallbackRequest } from './dto/payment.dto';
export declare class PaymentService {
    private readonly prisma;
    private readonly mockGateway;
    private readonly logger;
    constructor(prisma: PrismaService, mockGateway: MockGatewayService);
    private get client();
    initiate(request: InitiatePaymentRequest): Promise<{
        orderId: string;
        outTradeNo: string;
        payUrl: string | null;
        status: string;
        expiredAt: Date | null;
        qrCode?: undefined;
    } | {
        orderId: string;
        outTradeNo: string;
        payUrl: string;
        qrCode: string;
        status: string;
        expiredAt: Date;
    }>;
    handleCallback(request: PaymentCallbackRequest): Promise<{
        success: boolean;
        status: string;
    } | {
        success: boolean;
        message: string;
    }>;
    private getMockPayUrl;
    queryOrder(orderId: string): Promise<{
        orderId: string;
        outTradeNo: string;
        applicationId: string;
        amount: number;
        currency: string;
        channel: string;
        status: string;
        transactionId: string | null;
        paidAt: Date | null;
        expiredAt: Date | null;
        createdAt: Date;
    }>;
    listMyOrders(candidateId: string): Promise<{
        orderId: string;
        outTradeNo: string;
        applicationId: string;
        amount: number;
        currency: string;
        channel: string;
        status: string;
        paidAt: Date | null;
        createdAt: Date;
    }[]>;
}
