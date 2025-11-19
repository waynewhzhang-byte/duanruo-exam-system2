package com.duanruo.exam.infrastructure.payment;

import com.duanruo.exam.domain.payment.PaymentChannel;
import com.duanruo.exam.domain.payment.PaymentGateway;
import com.duanruo.exam.domain.payment.PaymentOrder;
import com.duanruo.exam.domain.payment.PaymentStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 模拟支付网关（用于测试）
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentParams createPayment(PaymentOrder order) {
        // 模拟支付：返回一个模拟的支付URL
        String payUrl = "http://localhost:3000/mock-payment?outTradeNo=" + order.getOutTradeNo();
        
        Map<String, Object> extraParams = new HashMap<>();
        extraParams.put("mockMode", true);
        extraParams.put("autoSuccess", true);
        
        return new PaymentParams(
                order.getOutTradeNo(),
                payUrl,
                null,
                null,
                extraParams
        );
    }

    @Override
    public PaymentQueryResult queryPayment(String outTradeNo) {
        // 模拟查询：总是返回成功
        return new PaymentQueryResult(
                outTradeNo,
                "MOCK_TXN_" + outTradeNo,
                PaymentStatus.SUCCESS,
                BigDecimal.valueOf(100.00),
                "模拟支付成功"
        );
    }

    @Override
    public boolean verifyCallback(Map<String, String> params) {
        // 模拟验证：总是返回true
        return true;
    }

    @Override
    public PaymentCallbackData parseCallback(Map<String, String> params) {
        String outTradeNo = params.get("outTradeNo");
        String amount = params.getOrDefault("amount", "100.00");
        
        return new PaymentCallbackData(
                outTradeNo,
                "MOCK_TXN_" + outTradeNo,
                new BigDecimal(amount),
                PaymentStatus.SUCCESS,
                params.toString()
        );
    }

    @Override
    public RefundResult refund(String outTradeNo, BigDecimal amount, String reason) {
        // 模拟退款：总是成功
        return new RefundResult(
                true,
                "MOCK_REFUND_" + outTradeNo,
                "模拟退款成功"
        );
    }

    @Override
    public PaymentChannel getChannel() {
        return PaymentChannel.MOCK;
    }
}

