package com.duanruo.exam.domain.payment;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 支付网关接口（Port）
 * 由Infrastructure层实现具体的支付网关适配器
 */
public interface PaymentGateway {
    
    /**
     * 创建支付订单，返回支付参数
     * 
     * @param order 支付订单
     * @return 支付参数（用于前端调起支付）
     */
    PaymentParams createPayment(PaymentOrder order);
    
    /**
     * 查询支付状态
     * 
     * @param outTradeNo 商户订单号
     * @return 支付状态查询结果
     */
    PaymentQueryResult queryPayment(String outTradeNo);
    
    /**
     * 验证回调签名
     * 
     * @param params 回调参数
     * @return 签名是否有效
     */
    boolean verifyCallback(Map<String, String> params);
    
    /**
     * 解析回调参数
     * 
     * @param params 回调参数
     * @return 回调数据
     */
    PaymentCallbackData parseCallback(Map<String, String> params);
    
    /**
     * 退款
     * 
     * @param outTradeNo 商户订单号
     * @param amount 退款金额
     * @param reason 退款原因
     * @return 退款结果
     */
    RefundResult refund(String outTradeNo, BigDecimal amount, String reason);
    
    /**
     * 获取支付渠道
     */
    PaymentChannel getChannel();
    
    /**
     * 支付参数
     */
    record PaymentParams(
            String outTradeNo,
            String payUrl,      // 支付URL（PC网站支付）
            String qrCode,      // 二维码内容（扫码支付）
            String formData,    // 表单数据（手机网站支付）
            Map<String, Object> extraParams // 其他参数
    ) {}
    
    /**
     * 支付查询结果
     */
    record PaymentQueryResult(
            String outTradeNo,
            String transactionId,
            PaymentStatus status,
            BigDecimal amount,
            String message
    ) {}
    
    /**
     * 支付回调数据
     */
    record PaymentCallbackData(
            String outTradeNo,
            String transactionId,
            BigDecimal amount,
            PaymentStatus status,
            String rawData
    ) {}
    
    /**
     * 退款结果
     */
    record RefundResult(
            boolean success,
            String refundId,
            String message
    ) {}
}

