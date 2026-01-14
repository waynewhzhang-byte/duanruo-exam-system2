export declare enum PaymentChannel {
    ALIPAY = "ALIPAY",
    WECHAT = "WECHAT",
    MOCK = "MOCK"
}
export declare class InitiatePaymentRequest {
    applicationId: string;
    channel: PaymentChannel;
}
export declare class PaymentCallbackRequest {
    outTradeNo: string;
    transactionId?: string;
    status?: string;
    payload?: Record<string, unknown>;
}
