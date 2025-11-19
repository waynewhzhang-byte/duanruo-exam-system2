package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.ticket.TicketStatus;
import com.duanruo.exam.infrastructure.persistence.entity.TicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 准考证Spring Data JPA Repository
 */
@Repository
public interface JpaTicketRepository extends JpaRepository<TicketEntity, UUID> {
    
    /**
     * 根据准考证号查找
     */
    Optional<TicketEntity> findByTicketNo(String ticketNo);
    
    /**
     * 根据报名ID查找
     */
    Optional<TicketEntity> findByApplicationId(UUID applicationId);
    
    /**
     * 根据考试ID查找所有准考证
     */
    List<TicketEntity> findByExamId(UUID examId);
    
    /**
     * 根据考试ID和状态查找准考证
     */
    List<TicketEntity> findByExamIdAndStatus(UUID examId, TicketStatus status);
    
    /**
     * 统计考试的准考证数量
     */
    long countByExamId(UUID examId);
    
    /**
     * 统计考试中指定状态的准考证数量
     */
    long countByExamIdAndStatus(UUID examId, TicketStatus status);
    
    /**
     * 检查准考证号是否存在
     */
    boolean existsByTicketNo(String ticketNo);
    
    /**
     * 根据考试ID查询统计信息
     */
    @Query("""
        SELECT t.status as status, COUNT(t) as count
        FROM TicketEntity t
        WHERE t.examId = :examId
        GROUP BY t.status
        """)
    List<Object[]> countByExamIdGroupByStatus(@Param("examId") UUID examId);
}

