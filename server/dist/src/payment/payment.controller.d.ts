import { PaymentService } from './payment.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { InitiatePaymentRequest, PaymentCallbackRequest } from './dto/payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    initiate(request: InitiatePaymentRequest): Promise<ApiResult<{
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
    }>>;
    callback(request: PaymentCallbackRequest): Promise<ApiResult<{
        success: boolean;
        status: string;
    } | {
        success: boolean;
        message: string;
    }>>;
    queryOrder(orderId: string): Promise<ApiResult<{
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
    }>>;
    listMyOrders(req: any): Promise<ApiResult<{
        orderId: string;
        outTradeNo: string;
        applicationId: string;
        amount: number;
        currency: string;
        channel: string;
        status: string;
        paidAt: Date | null;
        createdAt: Date;
    }[]>>;
}
