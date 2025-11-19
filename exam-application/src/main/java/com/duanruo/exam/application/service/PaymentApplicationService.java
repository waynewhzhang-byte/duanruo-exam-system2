package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ApplicationResponse;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.payment.*;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 支付应用服务
 * - 创建支付订单
 * - 处理支付回调
 * - 查询支付状态
 */
@Service
@Transactional
public class PaymentApplicationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentApplicationService.class);

    private final ApplicationApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final ExamRepository examRepository;
    private final SeatAssignmentRepository seatAssignmentRepository;
    private final TicketApplicationService ticketApplicationService;
    private final PaymentOrderRepository paymentOrderRepository;
    private final List<PaymentGateway> paymentGateways;

    // In-memory idempotency store for processed callbacks (appId|transactionId)
    private final ConcurrentMap<String, Boolean> processedCallbacks = new ConcurrentHashMap<>();

    public PaymentApplicationService(
            ApplicationApplicationService applicationService,
            ApplicationRepository applicationRepository,
            ExamRepository examRepository,
            SeatAssignmentRepository seatAssignmentRepository,
            TicketApplicationService ticketApplicationService,
            PaymentOrderRepository paymentOrderRepository,
            List<PaymentGateway> paymentGateways) {
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
        this.examRepository = examRepository;
        this.seatAssignmentRepository = seatAssignmentRepository;
        this.ticketApplicationService = ticketApplicationService;
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentGateways = paymentGateways;

        log.info("支付应用服务初始化成功，可用支付网关: {}",
                paymentGateways.stream().map(g -> g.getChannel().name()).toList());
    }

    /**
     * 创建支付订单并返回支付参数
     *
     * @param applicationId 报名申请ID
     * @param channelName 支付渠道名称（ALIPAY, WECHAT, MOCK）
     * @return 支付参数
     */
    public Map<String, Object> initiate(UUID applicationId, String channelName) {
        // 1. 查找报名申请和考试信息
        var app = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("报名申请不存在"));
        var exam = examRepository.findById(app.getExamId())
                .orElseThrow(() -> new IllegalArgumentException("考试不存在"));

        // 2. 确定支付金额
        BigDecimal amount = determineAmount(applicationId);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("支付金额必须大于0");
        }

        // 3. 确定支付渠道
        PaymentChannel channel = parseChannel(channelName);
        PaymentGateway gateway = findGateway(channel);

        // 4. 创建支付订单
        PaymentOrder order = PaymentOrder.create(
                ApplicationId.of(applicationId),
                amount,
                "CNY",
                channel
        );

        // 5. 保存支付订单
        order = paymentOrderRepository.save(order);

        // 6. 调用支付网关创建支付
        PaymentGateway.PaymentParams params = gateway.createPayment(order);

        // 7. 更新支付订单状态为处理中
        order.markAsProcessing(params.toString());
        paymentOrderRepository.save(order);

        log.info("支付订单创建成功，outTradeNo: {}, channel: {}, amount: {}",
                order.getOutTradeNo(), channel, amount);

        // 8. 返回支付参数
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId().getValue().toString());
        result.put("outTradeNo", order.getOutTradeNo());
        result.put("applicationId", applicationId.toString());
        result.put("channel", channel.name());
        result.put("amount", amount.toPlainString());
        result.put("payUrl", params.payUrl());
        result.put("qrCode", params.qrCode());
        result.put("formData", params.formData());
        result.put("extraParams", params.extraParams());

        return result;
    }

    private BigDecimal determineAmount(UUID applicationId) {
        var app = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("报名申请不存在"));
        var exam = examRepository.findById(app.getExamId())
                .orElseThrow(() -> new IllegalArgumentException("考试不存在"));
        if (!exam.isFeeRequired()) return BigDecimal.ZERO;
        return exam.getFeeAmount() != null ? exam.getFeeAmount() : BigDecimal.ZERO;
    }

    /**
     * 解析支付渠道
     */
    private PaymentChannel parseChannel(String channelName) {
        if (channelName == null || channelName.isBlank()) {
            return PaymentChannel.MOCK;
        }
        try {
            return PaymentChannel.valueOf(channelName.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("不支持的支付渠道: {}, 使用MOCK", channelName);
            return PaymentChannel.MOCK;
        }
    }

    /**
     * 查找支付网关
     */
    private PaymentGateway findGateway(PaymentChannel channel) {
        return paymentGateways.stream()
                .filter(g -> g.getChannel() == channel)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("不支持的支付渠道: " + channel));
    }

    /**
     * 处理支付回调（幂等）
     *
     * @param outTradeNo 商户订单号
     * @param callbackData 回调数据
     * @return 处理结果
     */
    public Map<String, Object> onPaid(String outTradeNo, Map<String, String> callbackData) {
        // 1. 查找支付订单
        PaymentOrder order = paymentOrderRepository.findByOutTradeNo(outTradeNo)
                .orElseThrow(() -> new IllegalArgumentException("支付订单不存在: " + outTradeNo));

        // 2. 幂等性检查
        String transactionId = callbackData.get("transactionId");
        String key = order.getApplicationId().getValue() + "|" + transactionId;
        if (processedCallbacks.putIfAbsent(key, Boolean.TRUE) != null) {
            log.info("支付回调已处理，跳过: outTradeNo={}, transactionId={}", outTradeNo, transactionId);
            var app = applicationRepository.findById(order.getApplicationId()).orElseThrow();
            return buildResponse(order, app.getStatus().name(), true, false, null);
        }

        // 3. 验证回调签名
        PaymentChannel channel = order.getChannel();
        PaymentGateway gateway = findGateway(channel);
        if (!gateway.verifyCallback(callbackData)) {
            log.error("支付回调签名验证失败: outTradeNo={}", outTradeNo);
            throw new IllegalArgumentException("支付回调签名验证失败");
        }

        // 4. 解析回调数据
        PaymentGateway.PaymentCallbackData parsed = gateway.parseCallback(callbackData);

        // 5. 更新支付订单状态
        if (parsed.status() == PaymentStatus.SUCCESS) {
            order.markAsSuccess(parsed.transactionId(), parsed.rawData());
        } else {
            order.markAsFailed("支付失败: " + parsed.status());
        }
        paymentOrderRepository.save(order);

        // 6. 更新报名申请状态为已支付
        ApplicationResponse resp = applicationService.markPaid(order.getApplicationId().getValue());

        // 7. 免费考试：尝试自动生成准考证
        var app = applicationRepository.findById(order.getApplicationId()).orElseThrow();
        var exam = examRepository.findById(app.getExamId()).orElseThrow();
        boolean ticketIssued = false;
        String ticketNumber = null;
        if (!exam.isFeeRequired()) {
            var seatOpt = seatAssignmentRepository.findByApplicationId(app.getId());
            if (seatOpt.isPresent()) {
                var ticketNo = ticketApplicationService.generate(order.getApplicationId().getValue());
                ticketIssued = true;
                ticketNumber = ticketNo.getValue();
            }
        }

        log.info("支付回调处理成功: outTradeNo={}, transactionId={}, applicationId={}",
                outTradeNo, parsed.transactionId(), order.getApplicationId().getValue());

        return buildResponse(order, resp.status(), false, ticketIssued, ticketNumber);
    }

    /**
     * 兼容旧的回调接口
     */
    public Map<String, Object> onPaid(UUID applicationId, String channel, BigDecimal amount, String transactionId) {
        Map<String, String> callbackData = new HashMap<>();
        callbackData.put("applicationId", applicationId.toString());
        callbackData.put("channel", channel);
        callbackData.put("amount", amount.toString());
        callbackData.put("transactionId", transactionId);

        // 查找支付订单
        List<PaymentOrder> orders = paymentOrderRepository.findByApplicationId(ApplicationId.of(applicationId));
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("未找到支付订单");
        }

        PaymentOrder order = orders.get(0);
        return onPaid(order.getOutTradeNo(), callbackData);
    }

    /**
     * 查询支付状态
     *
     * @param outTradeNo 商户订单号
     * @return 支付状态信息
     */
    public Map<String, Object> queryPaymentStatus(String outTradeNo) {
        // 1. 查找支付订单
        PaymentOrder order = paymentOrderRepository.findByOutTradeNo(outTradeNo)
                .orElseThrow(() -> new IllegalArgumentException("支付订单不存在: " + outTradeNo));

        // 2. 如果订单已经是最终状态，直接返回
        if (order.getStatus() == PaymentStatus.SUCCESS ||
            order.getStatus() == PaymentStatus.FAILED ||
            order.getStatus() == PaymentStatus.CANCELLED) {
            return buildQueryResponse(order);
        }

        // 3. 调用支付网关查询最新状态
        PaymentChannel channel = order.getChannel();
        PaymentGateway gateway = findGateway(channel);
        PaymentGateway.PaymentQueryResult queryResult = gateway.queryPayment(outTradeNo);

        // 4. 更新订单状态
        if (queryResult.status() == PaymentStatus.SUCCESS && order.getStatus() != PaymentStatus.SUCCESS) {
            order.markAsSuccess(queryResult.transactionId(), queryResult.message());
            paymentOrderRepository.save(order);

            // 5. 更新报名申请状态为已支付
            applicationService.markPaid(order.getApplicationId().getValue());

            log.info("支付状态查询成功并更新订单: outTradeNo={}, status={}", outTradeNo, queryResult.status());
        } else if (queryResult.status() == PaymentStatus.FAILED && order.getStatus() != PaymentStatus.FAILED) {
            order.markAsFailed(queryResult.message());
            paymentOrderRepository.save(order);
        }

        return buildQueryResponse(order);
    }

    /**
     * 构建查询响应
     */
    private Map<String, Object> buildQueryResponse(PaymentOrder order) {
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId().getValue().toString());
        result.put("outTradeNo", order.getOutTradeNo());
        result.put("applicationId", order.getApplicationId().getValue().toString());
        result.put("status", order.getStatus().name());
        result.put("channel", order.getChannel().name());
        result.put("transactionId", order.getTransactionId());
        result.put("amount", order.getAmount().toPlainString());
        result.put("paidAt", order.getPaidAt() != null ? order.getPaidAt().toString() : null);
        return result;
    }

    /**
     * 构建响应
     */
    private Map<String, Object> buildResponse(
            PaymentOrder order,
            String status,
            boolean idempotent,
            boolean ticketIssued,
            String ticketNumber) {
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId().getValue().toString());
        result.put("outTradeNo", order.getOutTradeNo());
        result.put("applicationId", order.getApplicationId().getValue().toString());
        result.put("status", status);
        result.put("channel", order.getChannel().name());
        result.put("transactionId", order.getTransactionId());
        result.put("amount", order.getAmount().toPlainString());
        result.put("idempotent", idempotent);
        result.put("ticketIssued", ticketIssued);
        result.put("ticketNumber", ticketNumber == null ? "" : ticketNumber);
        return result;
    }
}

