package com.duanruo.exam.infrastructure.persistence.jpa;

import com.duanruo.exam.domain.payment.PaymentStatus;
import com.duanruo.exam.infrastructure.persistence.entity.PaymentOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 支付订单JPA仓储
 */
@Repository
public interface JpaPaymentOrderRepository extends JpaRepository<PaymentOrderEntity, UUID> {
    
    /**
     * 根据商户订单号查找
     */
    Optional<PaymentOrderEntity> findByOutTradeNo(String outTradeNo);
    
    /**
     * 根据报名申请ID查找
     */
    List<PaymentOrderEntity> findByApplicationId(UUID applicationId);
    
    /**
     * 根据第三方交易号查找
     */
    Optional<PaymentOrderEntity> findByTransactionId(String transactionId);
    
    /**
     * 查找所有待支付且已过期的订单
     */
    @Query("SELECT p FROM PaymentOrderEntity p WHERE p.status IN :statuses AND p.expiredAt < :now")
    List<PaymentOrderEntity> findExpiredOrders(
            @Param("statuses") List<PaymentStatus> statuses,
            @Param("now") LocalDateTime now
    );

    /**
     * 根据考试ID查找所有支付订单
     * 通过关联 application 表查询
     */
    @Query("SELECT p FROM PaymentOrderEntity p " +
           "JOIN ApplicationEntity a ON p.applicationId = a.id " +
           "WHERE a.examId = :examId")
    List<PaymentOrderEntity> findByExamId(@Param("examId") UUID examId);
}

