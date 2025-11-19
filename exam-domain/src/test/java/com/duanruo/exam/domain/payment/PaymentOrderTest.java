package com.duanruo.exam.domain.payment;

import com.duanruo.exam.domain.application.ApplicationId;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * 支付订单聚合根单元测试
 */
class PaymentOrderTest {

    // ========== 创建支付订单测试 ==========

    @Test
    void create_shouldCreatePaymentOrder_whenValidDataProvided() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());
        BigDecimal amount = new BigDecimal("100.00");
        String currency = "CNY";
        PaymentChannel channel = PaymentChannel.ALIPAY;

        // When
        PaymentOrder order = PaymentOrder.create(applicationId, amount, currency, channel);

        // Then
        assertThat(order).isNotNull();
        assertThat(order.getId()).isNotNull();
        assertThat(order.getApplicationId()).isEqualTo(applicationId);
        assertThat(order.getAmount()).isEqualByComparingTo(amount);
        assertThat(order.getCurrency()).isEqualTo(currency);
        assertThat(order.getChannel()).isEqualTo(channel);
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(order.getOutTradeNo()).isNotNull();
        assertThat(order.getOutTradeNo()).startsWith("PAY");
        assertThat(order.getExpiredAt()).isNotNull();
        assertThat(order.getCreatedAt()).isNotNull();
        assertThat(order.getUpdatedAt()).isNotNull();
    }

    @Test
    void create_shouldThrowException_whenApplicationIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                null,
                new BigDecimal("100.00"),
                "CNY",
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("applicationId不能为空");
    }

    @Test
    void create_shouldThrowException_whenAmountIsNull() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                null,
                "CNY",
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("支付金额必须大于0");
    }

    @Test
    void create_shouldThrowException_whenAmountIsZero() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                BigDecimal.ZERO,
                "CNY",
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("支付金额必须大于0");
    }

    @Test
    void create_shouldThrowException_whenAmountIsNegative() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                new BigDecimal("-100.00"),
                "CNY",
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("支付金额必须大于0");
    }

    @Test
    void create_shouldThrowException_whenCurrencyIsNull() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                new BigDecimal("100.00"),
                null,
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("币种不能为空");
    }

    @Test
    void create_shouldThrowException_whenCurrencyIsBlank() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                new BigDecimal("100.00"),
                "  ",
                PaymentChannel.ALIPAY
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("币种不能为空");
    }

    @Test
    void create_shouldThrowException_whenChannelIsNull() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> PaymentOrder.create(
                applicationId,
                new BigDecimal("100.00"),
                "CNY",
                null
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("支付渠道不能为空");
    }

    // ========== 标记为处理中测试 ==========

    @Test
    void markAsProcessing_shouldMarkAsProcessing_whenOrderIsPending() {
        // Given
        PaymentOrder order = createPendingOrder();
        String paymentParams = "{\"qr_code\":\"https://example.com/qr\"}";

        // When
        order.markAsProcessing(paymentParams);

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(order.getPaymentParams()).isEqualTo(paymentParams);
    }

    @Test
    void markAsProcessing_shouldThrowException_whenOrderIsNotPending() {
        // Given
        PaymentOrder order = createSuccessOrder();

        // When & Then
        assertThatThrownBy(() -> order.markAsProcessing("{\"qr_code\":\"xxx\"}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("只有待支付状态才能标记为处理中");
    }

    // ========== 标记为成功测试 ==========

    @Test
    void markAsSuccess_shouldMarkAsSuccess_whenOrderIsPending() {
        // Given
        PaymentOrder order = createPendingOrder();
        String transactionId = "TXN-123456";
        String callbackData = "{\"status\":\"success\"}";

        // When
        order.markAsSuccess(transactionId, callbackData);

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(order.getTransactionId()).isEqualTo(transactionId);
        assertThat(order.getCallbackData()).isEqualTo(callbackData);
        assertThat(order.getPaidAt()).isNotNull();
    }

    @Test
    void markAsSuccess_shouldMarkAsSuccess_whenOrderIsProcessing() {
        // Given
        PaymentOrder order = createProcessingOrder();
        String transactionId = "TXN-123456";
        String callbackData = "{\"status\":\"success\"}";

        // When
        order.markAsSuccess(transactionId, callbackData);

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(order.getTransactionId()).isEqualTo(transactionId);
        assertThat(order.getCallbackData()).isEqualTo(callbackData);
        assertThat(order.getPaidAt()).isNotNull();
    }

    @Test
    void markAsSuccess_shouldThrowException_whenOrderIsAlreadySuccess() {
        // Given
        PaymentOrder order = createSuccessOrder();

        // When & Then
        assertThatThrownBy(() -> order.markAsSuccess("TXN-999", "{}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("当前状态不允许标记为成功");
    }

    // ========== 标记为失败测试 ==========

    @Test
    void markAsFailed_shouldMarkAsFailed_whenOrderIsNotTerminal() {
        // Given
        PaymentOrder order = createPendingOrder();
        String failureReason = "支付超时";

        // When
        order.markAsFailed(failureReason);

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(order.getFailureReason()).isEqualTo(failureReason);
    }

    @Test
    void markAsFailed_shouldThrowException_whenOrderIsTerminal() {
        // Given
        PaymentOrder order = createSuccessOrder();

        // When & Then
        assertThatThrownBy(() -> order.markAsFailed("失败原因"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("终态订单不能标记为失败");
    }

    // ========== 取消订单测试 ==========

    @Test
    void cancel_shouldCancelOrder_whenOrderCanBeCancelled() {
        // Given
        PaymentOrder order = createPendingOrder();

        // When
        order.cancel();

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    void cancel_shouldThrowException_whenOrderCannotBeCancelled() {
        // Given
        PaymentOrder order = createSuccessOrder();

        // When & Then
        assertThatThrownBy(() -> order.cancel())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("当前状态不允许取消");
    }

    // ========== 退款测试 ==========

    @Test
    void markAsRefunded_shouldMarkAsRefunded_whenOrderCanBeRefunded() {
        // Given
        PaymentOrder order = createSuccessOrder();

        // When
        order.markAsRefunded();

        // Then
        assertThat(order.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }

    @Test
    void markAsRefunded_shouldThrowException_whenOrderCannotBeRefunded() {
        // Given
        PaymentOrder order = createPendingOrder();

        // When & Then
        assertThatThrownBy(() -> order.markAsRefunded())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("当前状态不允许退款");
    }

    // ========== 辅助方法 ==========

    private PaymentOrder createPendingOrder() {
        return PaymentOrder.create(
                ApplicationId.of(UUID.randomUUID()),
                new BigDecimal("100.00"),
                "CNY",
                PaymentChannel.ALIPAY
        );
    }

    private PaymentOrder createProcessingOrder() {
        PaymentOrder order = createPendingOrder();
        order.markAsProcessing("{\"qr_code\":\"https://example.com/qr\"}");
        return order;
    }

    private PaymentOrder createSuccessOrder() {
        PaymentOrder order = createPendingOrder();
        order.markAsSuccess("TXN-123456", "{\"status\":\"success\"}");
        return order;
    }
}

