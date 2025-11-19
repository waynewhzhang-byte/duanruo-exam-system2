package com.duanruo.exam.infrastructure.payment;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradePagePayModel;
import com.alipay.api.domain.AlipayTradeQueryModel;
import com.alipay.api.domain.AlipayTradeRefundModel;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.alipay.api.request.AlipayTradeRefundRequest;
import com.alipay.api.response.AlipayTradePagePayResponse;
import com.alipay.api.response.AlipayTradeQueryResponse;
import com.alipay.api.response.AlipayTradeRefundResponse;
import com.duanruo.exam.infrastructure.config.PaymentProperties;
import com.duanruo.exam.domain.payment.PaymentChannel;
import com.duanruo.exam.domain.payment.PaymentGateway;
import com.duanruo.exam.domain.payment.PaymentOrder;
import com.duanruo.exam.domain.payment.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 支付宝支付网关实现
 */
@Component
@ConditionalOnProperty(prefix = "payment.alipay", name = "enabled", havingValue = "true")
public class AlipayPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(AlipayPaymentGateway.class);

    private final AlipayClient alipayClient;
    private final PaymentProperties.Alipay alipayConfig;

    public AlipayPaymentGateway(PaymentProperties paymentProperties) {
        this.alipayConfig = paymentProperties.getAlipay();
        
        // 初始化支付宝客户端
        this.alipayClient = new DefaultAlipayClient(
                alipayConfig.getGatewayUrl(),
                alipayConfig.getAppId(),
                alipayConfig.getPrivateKey(),
                alipayConfig.getFormat(),
                alipayConfig.getCharset(),
                alipayConfig.getPublicKey(),
                alipayConfig.getSignType()
        );
        
        log.info("支付宝支付网关初始化成功，AppId: {}", alipayConfig.getAppId());
    }

    @Override
    public PaymentParams createPayment(PaymentOrder order) {
        try {
            // 创建支付宝电脑网站支付请求
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            request.setNotifyUrl(alipayConfig.getNotifyUrl());
            request.setReturnUrl(alipayConfig.getReturnUrl());
            
            // 设置业务参数
            AlipayTradePagePayModel model = new AlipayTradePagePayModel();
            model.setOutTradeNo(order.getOutTradeNo());
            model.setTotalAmount(order.getAmount().toString());
            model.setSubject("考试报名费用");
            model.setProductCode("FAST_INSTANT_TRADE_PAY");
            model.setTimeExpire(order.getExpiredAt().toString());
            
            request.setBizModel(model);
            
            // 调用SDK生成表单
            AlipayTradePagePayResponse response = alipayClient.pageExecute(request);
            
            if (response.isSuccess()) {
                log.info("支付宝支付订单创建成功，outTradeNo: {}", order.getOutTradeNo());
                
                Map<String, Object> extraParams = new HashMap<>();
                extraParams.put("tradeNo", response.getTradeNo());
                
                return new PaymentParams(
                        order.getOutTradeNo(),
                        null,  // PC网站支付不需要payUrl
                        null,
                        response.getBody(),  // 返回表单HTML
                        extraParams
                );
            } else {
                log.error("支付宝支付订单创建失败: {}", response.getSubMsg());
                throw new RuntimeException("支付宝支付订单创建失败: " + response.getSubMsg());
            }
            
        } catch (AlipayApiException e) {
            log.error("调用支付宝API失败", e);
            throw new RuntimeException("调用支付宝API失败: " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentQueryResult queryPayment(String outTradeNo) {
        try {
            AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
            AlipayTradeQueryModel model = new AlipayTradeQueryModel();
            model.setOutTradeNo(outTradeNo);
            request.setBizModel(model);
            
            AlipayTradeQueryResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                PaymentStatus status = mapAlipayStatus(response.getTradeStatus());
                BigDecimal amount = new BigDecimal(response.getTotalAmount());
                
                return new PaymentQueryResult(
                        outTradeNo,
                        response.getTradeNo(),
                        status,
                        amount,
                        response.getMsg()
                );
            } else {
                log.warn("查询支付宝订单失败: {}", response.getSubMsg());
                return new PaymentQueryResult(
                        outTradeNo,
                        null,
                        PaymentStatus.FAILED,
                        BigDecimal.ZERO,
                        response.getSubMsg()
                );
            }
            
        } catch (AlipayApiException e) {
            log.error("查询支付宝订单异常", e);
            throw new RuntimeException("查询支付宝订单异常: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyCallback(Map<String, String> params) {
        try {
            return AlipaySignature.rsaCheckV1(
                    params,
                    alipayConfig.getPublicKey(),
                    alipayConfig.getCharset(),
                    alipayConfig.getSignType()
            );
        } catch (AlipayApiException e) {
            log.error("验证支付宝回调签名失败", e);
            return false;
        }
    }

    @Override
    public PaymentCallbackData parseCallback(Map<String, String> params) {
        String outTradeNo = params.get("out_trade_no");
        String tradeNo = params.get("trade_no");
        String totalAmount = params.get("total_amount");
        String tradeStatus = params.get("trade_status");
        
        PaymentStatus status = mapAlipayStatus(tradeStatus);
        
        return new PaymentCallbackData(
                outTradeNo,
                tradeNo,
                new BigDecimal(totalAmount),
                status,
                params.toString()
        );
    }

    @Override
    public RefundResult refund(String outTradeNo, BigDecimal amount, String reason) {
        try {
            AlipayTradeRefundRequest request = new AlipayTradeRefundRequest();
            AlipayTradeRefundModel model = new AlipayTradeRefundModel();
            model.setOutTradeNo(outTradeNo);
            model.setRefundAmount(amount.toString());
            model.setRefundReason(reason);
            request.setBizModel(model);
            
            AlipayTradeRefundResponse response = alipayClient.execute(request);
            
            if (response.isSuccess()) {
                log.info("支付宝退款成功，outTradeNo: {}, refundAmount: {}", outTradeNo, amount);
                return new RefundResult(
                        true,
                        response.getTradeNo(),
                        "退款成功"
                );
            } else {
                log.error("支付宝退款失败: {}", response.getSubMsg());
                return new RefundResult(
                        false,
                        null,
                        response.getSubMsg()
                );
            }
            
        } catch (AlipayApiException e) {
            log.error("调用支付宝退款API失败", e);
            return new RefundResult(
                    false,
                    null,
                    "退款异常: " + e.getMessage()
            );
        }
    }

    @Override
    public PaymentChannel getChannel() {
        return PaymentChannel.ALIPAY;
    }

    /**
     * 映射支付宝交易状态到系统支付状态
     */
    private PaymentStatus mapAlipayStatus(String tradeStatus) {
        return switch (tradeStatus) {
            case "WAIT_BUYER_PAY" -> PaymentStatus.PENDING;
            case "TRADE_SUCCESS", "TRADE_FINISHED" -> PaymentStatus.SUCCESS;
            case "TRADE_CLOSED" -> PaymentStatus.CANCELLED;
            default -> PaymentStatus.FAILED;
        };
    }
}

