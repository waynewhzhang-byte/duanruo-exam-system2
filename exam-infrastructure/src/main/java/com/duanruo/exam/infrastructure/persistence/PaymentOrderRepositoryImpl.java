package com.duanruo.exam.infrastructure.persistence;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.payment.*;
import com.duanruo.exam.infrastructure.persistence.entity.PaymentOrderEntity;
import com.duanruo.exam.infrastructure.persistence.jpa.JpaPaymentOrderRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 支付订单仓储实现
 */
@Component
public class PaymentOrderRepositoryImpl implements PaymentOrderRepository {

    private final JpaPaymentOrderRepository jpaRepository;

    public PaymentOrderRepositoryImpl(JpaPaymentOrderRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PaymentOrder save(PaymentOrder order) {
        PaymentOrderEntity entity = toEntity(order);
        PaymentOrderEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<PaymentOrder> findById(PaymentOrderId id) {
        return jpaRepository.findById(id.getValue())
                .map(this::toDomain);
    }

    @Override
    public Optional<PaymentOrder> findByOutTradeNo(String outTradeNo) {
        return jpaRepository.findByOutTradeNo(outTradeNo)
                .map(this::toDomain);
    }

    @Override
    public List<PaymentOrder> findByApplicationId(ApplicationId applicationId) {
        return jpaRepository.findByApplicationId(applicationId.getValue())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<PaymentOrder> findByTransactionId(String transactionId) {
        return jpaRepository.findByTransactionId(transactionId)
                .map(this::toDomain);
    }

    @Override
    public List<PaymentOrder> findExpiredPendingOrders() {
        List<PaymentStatus> statuses = List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING);
        return jpaRepository.findExpiredOrders(statuses, LocalDateTime.now())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<PaymentOrder> findByExamId(com.duanruo.exam.domain.exam.ExamId examId) {
        return jpaRepository.findByExamId(examId.getValue())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    /**
     * 实体转领域对象
     */
    private PaymentOrder toDomain(PaymentOrderEntity entity) {
        PaymentOrder order = PaymentOrder.create(
                ApplicationId.of(entity.getApplicationId()),
                entity.getAmount(),
                entity.getCurrency(),
                entity.getChannel()
        );

        // 使用反射设置其他字段
        try {
            setField(order, "id", PaymentOrderId.of(entity.getId()));
            setField(order, "outTradeNo", entity.getOutTradeNo());
            setField(order, "status", entity.getStatus());
            setField(order, "transactionId", entity.getTransactionId());
            setField(order, "paymentParams", entity.getPaymentParams());
            setField(order, "callbackData", entity.getCallbackData());
            setField(order, "failureReason", entity.getFailureReason());
            setField(order, "paidAt", entity.getPaidAt());
            setField(order, "expiredAt", entity.getExpiredAt());
            setField(order, "createdAt", entity.getCreatedAt());
            setField(order, "updatedAt", entity.getUpdatedAt());
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert entity to domain object", e);
        }

        return order;
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    /**
     * 领域对象转实体
     */
    private PaymentOrderEntity toEntity(PaymentOrder order) {
        PaymentOrderEntity entity = new PaymentOrderEntity();
        entity.setId(order.getId().getValue());
        entity.setApplicationId(order.getApplicationId().getValue());
        entity.setOutTradeNo(order.getOutTradeNo());
        entity.setAmount(order.getAmount());
        entity.setCurrency(order.getCurrency());
        entity.setChannel(order.getChannel());
        entity.setStatus(order.getStatus());
        entity.setTransactionId(order.getTransactionId());
        entity.setPaymentParams(order.getPaymentParams());
        entity.setCallbackData(order.getCallbackData());
        entity.setFailureReason(order.getFailureReason());
        entity.setPaidAt(order.getPaidAt());
        entity.setExpiredAt(order.getExpiredAt());
        entity.setCreatedAt(order.getCreatedAt());
        entity.setUpdatedAt(order.getUpdatedAt());
        return entity;
    }
}

