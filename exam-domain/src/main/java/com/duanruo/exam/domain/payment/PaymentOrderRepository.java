package com.duanruo.exam.domain.payment;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;

import java.util.List;
import java.util.Optional;

/**
 * 支付订单仓储接口
 */
public interface PaymentOrderRepository {

    /**
     * 保存支付订单
     */
    PaymentOrder save(PaymentOrder order);

    /**
     * 根据ID查找
     */
    Optional<PaymentOrder> findById(PaymentOrderId id);

    /**
     * 根据商户订单号查找
     */
    Optional<PaymentOrder> findByOutTradeNo(String outTradeNo);

    /**
     * 根据报名申请ID查找
     */
    List<PaymentOrder> findByApplicationId(ApplicationId applicationId);

    /**
     * 根据第三方交易号查找
     */
    Optional<PaymentOrder> findByTransactionId(String transactionId);

    /**
     * 查找所有待支付且已过期的订单
     */
    List<PaymentOrder> findExpiredPendingOrders();

    /**
     * 根据考试ID查找所有支付订单
     * 通过关联 application 表查询
     */
    List<PaymentOrder> findByExamId(ExamId examId);
}

