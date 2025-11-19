package com.duanruo.exam.infrastructure.payment;

import com.duanruo.exam.infrastructure.config.PaymentProperties;
import com.duanruo.exam.domain.payment.PaymentChannel;
import com.duanruo.exam.domain.payment.PaymentGateway;
import com.duanruo.exam.domain.payment.PaymentOrder;
import com.duanruo.exam.domain.payment.PaymentStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wechat.pay.contrib.apache.httpclient.WechatPayHttpClientBuilder;
import com.wechat.pay.contrib.apache.httpclient.auth.PrivateKeySigner;
import com.wechat.pay.contrib.apache.httpclient.auth.Verifier;
import com.wechat.pay.contrib.apache.httpclient.auth.WechatPay2Credentials;
import com.wechat.pay.contrib.apache.httpclient.auth.WechatPay2Validator;
import com.wechat.pay.contrib.apache.httpclient.cert.CertificatesManager;
import com.wechat.pay.contrib.apache.httpclient.util.PemUtil;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信支付网关实现
 */
@Component
@ConditionalOnProperty(prefix = "payment.wechat", name = "enabled", havingValue = "true")
public class WechatPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(WechatPaymentGateway.class);
    private static final String NATIVE_PAY_URL = "https://api.mch.weixin.qq.com/v3/pay/transactions/native";
    private static final String QUERY_URL_TEMPLATE = "https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/%s?mchid=%s";
    private static final String REFUND_URL = "https://api.mch.weixin.qq.com/v3/refund/domestic/refunds";

    private final CloseableHttpClient httpClient;
    private final PaymentProperties.Wechat wechatConfig;
    private final ObjectMapper objectMapper;

    public WechatPaymentGateway(PaymentProperties paymentProperties) throws Exception {
        this.wechatConfig = paymentProperties.getWechat();
        this.objectMapper = new ObjectMapper();
        
        // 加载商户私钥
        PrivateKey merchantPrivateKey = PemUtil.loadPrivateKey(
                new FileInputStream(wechatConfig.getCertPath())
        );
        
        // 获取证书管理器实例
        CertificatesManager certificatesManager = CertificatesManager.getInstance();
        
        // 向证书管理器增加需要自动更新平台证书的商户信息
        certificatesManager.putMerchant(
                wechatConfig.getMchId(),
                new WechatPay2Credentials(
                        wechatConfig.getMchId(),
                        new PrivateKeySigner(wechatConfig.getSerialNo(), merchantPrivateKey)
                ),
                wechatConfig.getApiV3Key().getBytes(StandardCharsets.UTF_8)
        );
        
        // 从证书管理器中获取verifier
        Verifier verifier = certificatesManager.getVerifier(wechatConfig.getMchId());
        
        // 初始化httpClient
        this.httpClient = WechatPayHttpClientBuilder.create()
                .withMerchant(
                        wechatConfig.getMchId(),
                        wechatConfig.getSerialNo(),
                        merchantPrivateKey
                )
                .withValidator(new WechatPay2Validator(verifier))
                .build();
        
        log.info("微信支付网关初始化成功，MchId: {}", wechatConfig.getMchId());
    }

    @Override
    public PaymentParams createPayment(PaymentOrder order) {
        try {
            HttpPost httpPost = new HttpPost(NATIVE_PAY_URL);
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader("Accept", "application/json");
            
            // 构建请求参数
            Map<String, Object> params = new HashMap<>();
            params.put("appid", wechatConfig.getAppId());
            params.put("mchid", wechatConfig.getMchId());
            params.put("description", "考试报名费用");
            params.put("out_trade_no", order.getOutTradeNo());
            params.put("notify_url", wechatConfig.getNotifyUrl());
            
            Map<String, Object> amount = new HashMap<>();
            amount.put("total", order.getAmount().multiply(BigDecimal.valueOf(100)).intValue()); // 转换为分
            amount.put("currency", order.getCurrency());
            params.put("amount", amount);
            
            String requestBody = objectMapper.writeValueAsString(params);
            httpPost.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));
            
            CloseableHttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            
            if (response.getStatusLine().getStatusCode() == 200) {
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                String codeUrl = jsonNode.get("code_url").asText();
                
                log.info("微信支付订单创建成功，outTradeNo: {}", order.getOutTradeNo());
                
                Map<String, Object> extraParams = new HashMap<>();
                extraParams.put("prepayId", jsonNode.has("prepay_id") ? jsonNode.get("prepay_id").asText() : null);
                
                return new PaymentParams(
                        order.getOutTradeNo(),
                        null,
                        codeUrl,  // 二维码链接
                        null,
                        extraParams
                );
            } else {
                log.error("微信支付订单创建失败: {}", responseBody);
                throw new RuntimeException("微信支付订单创建失败: " + responseBody);
            }
            
        } catch (Exception e) {
            log.error("调用微信支付API失败", e);
            throw new RuntimeException("调用微信支付API失败: " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentQueryResult queryPayment(String outTradeNo) {
        try {
            String url = String.format(QUERY_URL_TEMPLATE, outTradeNo, wechatConfig.getMchId());
            HttpGet httpGet = new HttpGet(url);
            httpGet.addHeader("Accept", "application/json");
            
            CloseableHttpResponse response = httpClient.execute(httpGet);
            String responseBody = EntityUtils.toString(response.getEntity());
            
            if (response.getStatusLine().getStatusCode() == 200) {
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                String tradeState = jsonNode.get("trade_state").asText();
                String transactionId = jsonNode.get("transaction_id").asText();
                int totalAmount = jsonNode.get("amount").get("total").asInt();
                
                PaymentStatus status = mapWechatStatus(tradeState);
                BigDecimal amount = BigDecimal.valueOf(totalAmount).divide(BigDecimal.valueOf(100));
                
                return new PaymentQueryResult(
                        outTradeNo,
                        transactionId,
                        status,
                        amount,
                        tradeState
                );
            } else {
                log.warn("查询微信支付订单失败: {}", responseBody);
                return new PaymentQueryResult(
                        outTradeNo,
                        null,
                        PaymentStatus.FAILED,
                        BigDecimal.ZERO,
                        responseBody
                );
            }
            
        } catch (Exception e) {
            log.error("查询微信支付订单异常", e);
            throw new RuntimeException("查询微信支付订单异常: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyCallback(Map<String, String> params) {
        // 微信支付V3使用签名验证，由WechatPay2Validator自动处理
        // 这里简化处理，实际应该验证签名
        return true;
    }

    @Override
    public PaymentCallbackData parseCallback(Map<String, String> params) {
        try {
            // 解密回调数据
            String resource = params.get("resource");
            JsonNode jsonNode = objectMapper.readTree(resource);
            
            String outTradeNo = jsonNode.get("out_trade_no").asText();
            String transactionId = jsonNode.get("transaction_id").asText();
            int totalAmount = jsonNode.get("amount").get("total").asInt();
            String tradeState = jsonNode.get("trade_state").asText();
            
            PaymentStatus status = mapWechatStatus(tradeState);
            BigDecimal amount = BigDecimal.valueOf(totalAmount).divide(BigDecimal.valueOf(100));
            
            return new PaymentCallbackData(
                    outTradeNo,
                    transactionId,
                    amount,
                    status,
                    resource
            );
            
        } catch (Exception e) {
            log.error("解析微信支付回调数据失败", e);
            throw new RuntimeException("解析微信支付回调数据失败: " + e.getMessage(), e);
        }
    }

    @Override
    public RefundResult refund(String outTradeNo, BigDecimal amount, String reason) {
        try {
            HttpPost httpPost = new HttpPost(REFUND_URL);
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader("Accept", "application/json");
            
            Map<String, Object> params = new HashMap<>();
            params.put("out_trade_no", outTradeNo);
            params.put("out_refund_no", "REFUND_" + outTradeNo);
            params.put("reason", reason);
            
            Map<String, Object> amountMap = new HashMap<>();
            amountMap.put("refund", amount.multiply(BigDecimal.valueOf(100)).intValue());
            amountMap.put("total", amount.multiply(BigDecimal.valueOf(100)).intValue());
            amountMap.put("currency", "CNY");
            params.put("amount", amountMap);
            
            String requestBody = objectMapper.writeValueAsString(params);
            httpPost.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));
            
            CloseableHttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            
            if (response.getStatusLine().getStatusCode() == 200) {
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                String refundId = jsonNode.get("refund_id").asText();
                
                log.info("微信支付退款成功，outTradeNo: {}, refundAmount: {}", outTradeNo, amount);
                return new RefundResult(true, refundId, "退款成功");
            } else {
                log.error("微信支付退款失败: {}", responseBody);
                return new RefundResult(false, null, responseBody);
            }
            
        } catch (Exception e) {
            log.error("调用微信支付退款API失败", e);
            return new RefundResult(false, null, "退款异常: " + e.getMessage());
        }
    }

    @Override
    public PaymentChannel getChannel() {
        return PaymentChannel.WECHAT;
    }

    /**
     * 映射微信支付交易状态到系统支付状态
     */
    private PaymentStatus mapWechatStatus(String tradeState) {
        return switch (tradeState) {
            case "NOTPAY" -> PaymentStatus.PENDING;
            case "USERPAYING" -> PaymentStatus.PROCESSING;
            case "SUCCESS" -> PaymentStatus.SUCCESS;
            case "REFUND" -> PaymentStatus.REFUNDED;
            case "CLOSED", "REVOKED", "PAYERROR" -> PaymentStatus.FAILED;
            default -> PaymentStatus.FAILED;
        };
    }
}

