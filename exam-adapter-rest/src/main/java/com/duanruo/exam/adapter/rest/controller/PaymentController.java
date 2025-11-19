package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.constants.ApiConstants;
import com.duanruo.exam.adapter.rest.dto.PaymentInitiateRequest;
import com.duanruo.exam.adapter.rest.dto.PaymentCallbackRequest;
import com.duanruo.exam.adapter.rest.dto.PaymentQueryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/payments")
@Tag(name = "支付", description = "支付网关回调（Stub）与预下单初始化")
public class PaymentController {

    private final com.duanruo.exam.application.service.PaymentApplicationService paymentService;

    @Value("${payment.secret:TEST_SECRET}")
    private String paymentSecret;

    private final com.duanruo.exam.infrastructure.config.PaymentProperties paymentProperties;

    public PaymentController(com.duanruo.exam.application.service.PaymentApplicationService paymentService,
                             com.duanruo.exam.infrastructure.config.PaymentProperties paymentProperties) {
        this.paymentService = paymentService;
        this.paymentProperties = paymentProperties;
    }

    @Operation(summary = "支付预下单", description = "创建支付订单并返回支付参数")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/initiate")
    @PreAuthorize("hasAuthority('PAYMENT_INITIATE')")
    public ResponseEntity<Map<String, Object>> initiate(@Valid @RequestBody PaymentInitiateRequest request) {
        UUID appId = request.getApplicationId();
        String requested = (request.getChannel() == null || request.getChannel().isBlank()) ? "MOCK" : request.getChannel();
        String channel = requested;

        // 根据配置决定使用哪个支付渠道
        if (paymentProperties.isStubOnly()) {
            channel = "MOCK";
        } else {
            if ("ALIPAY".equalsIgnoreCase(requested) && !paymentProperties.getAlipay().isEnabled()) {
                channel = "MOCK";
            }
            if ("WECHAT".equalsIgnoreCase(requested) && !paymentProperties.getWechat().isEnabled()) {
                channel = "MOCK";
            }
        }

        return ResponseEntity.ok(paymentService.initiate(appId, channel));
    }

    @Operation(summary = "获取支付配置", description = "返回支付相关开关与币种，仅用于前端展示控制")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/config")
    @PreAuthorize("hasAuthority('PAYMENT_CONFIG_VIEW')")
    public ResponseEntity<Map<String, Object>> config() {
        Map<String, Object> channels = new HashMap<>();
        channels.put("alipayEnabled", paymentProperties.getAlipay().isEnabled());
        channels.put("wechatEnabled", paymentProperties.getWechat().isEnabled());
        channels.put("mockEnabled", true);

        Map<String, Object> body = new HashMap<>();
        body.put("currency", paymentProperties.getCurrency());
        body.put("stubOnly", paymentProperties.isStubOnly());
        body.put("channels", channels);
        return ResponseEntity.ok(body);
    }

    @Operation(summary = "查询支付状态", description = "根据商户订单号查询支付状态")
    @ApiResponse(responseCode = "200", description = "OK")
    @PostMapping("/query")
    @PreAuthorize("hasAuthority('PAYMENT_INITIATE')")
    public ResponseEntity<Map<String, Object>> query(@Valid @RequestBody PaymentQueryRequest request) {
        String outTradeNo = request.getOutTradeNo();

        // 查询支付订单状态
        Map<String, Object> result = paymentService.queryPaymentStatus(outTradeNo);

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "支付回调（签名校验）", description = "网关回调签名采用 HMAC-SHA256(secret) 计算；字段：appId, amount, channel, transactionId, nonce, timestamp, sign")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> callback(@Valid @RequestBody PaymentCallbackRequest req) {
        // 1) verify signature
        if (!verifySignature(req)) {
            return ResponseEntity.badRequest().body(Map.of(
                    ApiConstants.KEY_CODE, ApiConstants.ERROR_INVALID_SIGNATURE,
                    ApiConstants.KEY_MESSAGE, ApiConstants.MSG_SIGNATURE_INVALID
            ));
        }
        // 2) extract fields
        UUID appId = req.getAppId();
        String channel = (req.getChannel() == null || req.getChannel().isBlank()) ? ApiConstants.DEFAULT_CHANNEL : req.getChannel();
        String txnId = (req.getTransactionId() == null || req.getTransactionId().isBlank()) ? UUID.randomUUID().toString() : req.getTransactionId();
        java.math.BigDecimal amount = req.getAmount();
        // 3) delegate to application service (idempotent)
        Map<String, Object> resp = paymentService.onPaid(appId, channel, amount, txnId);
        return ResponseEntity.ok(resp);
    }

    private boolean verifySignature(PaymentCallbackRequest req) {
        if (req.getSign() == null) return false;
        Map<String, Object> fields = new TreeMap<>();
        fields.put("amount", req.getAmount() == null ? "" : req.getAmount().toPlainString());
        fields.put("appId", req.getAppId() == null ? "" : req.getAppId().toString());
        if (req.getChannel() != null) fields.put("channel", req.getChannel());
        if (req.getTransactionId() != null) fields.put("transactionId", req.getTransactionId());
        fields.put("nonce", req.getNonce() == null ? "" : req.getNonce());
        fields.put("timestamp", req.getTimestamp() == null ? "" : String.valueOf(req.getTimestamp()));
        String base = buildBaseString(fields);
        String calc = hmacSha256Hex(base, paymentSecret);
        return req.getSign().equalsIgnoreCase(calc);
    }

    private String buildBaseString(Map<String, Object> map) {
        // sorted by key (TreeMap ensured), join as key=value&...
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append('&');
            first = false;
            sb.append(e.getKey()).append('=').append(Objects.toString(e.getValue(), ""));
        }
        return sb.toString();
    }

    private String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : raw) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("failed to compute signature", e);
        }
    }
}

