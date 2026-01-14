import { PaymentService } from './payment.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { InitiatePaymentRequest, PaymentCallbackRequest } from './dto/payment.dto';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    initiate(request: InitiatePaymentRequest): Promise<ApiResult<{
        orderId: string;
        outTradeNo: string;
        payUrl: string;
        status: string;
    }>>;
    callback(request: PaymentCallbackRequest): Promise<ApiResult<{
        success: boolean;
        status: string;
    } | {
        success: boolean;
        message: string;
    }>>;
}
