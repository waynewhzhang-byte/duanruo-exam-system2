package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;

import java.util.List;
import java.util.Optional;

/**
 * 准考证仓储接口
 */
public interface TicketRepository {
    
    /**
     * 保存准考证
     */
    void save(Ticket ticket);
    
    /**
     * 根据ID查找准考证
     */
    Optional<Ticket> findById(TicketId id);
    
    /**
     * 根据准考证号查找准考证
     */
    Optional<Ticket> findByTicketNo(TicketNo ticketNo);
    
    /**
     * 根据报名ID查找准考证
     */
    Optional<Ticket> findByApplicationId(ApplicationId applicationId);
    
    /**
     * 根据考试ID查找所有准考证
     */
    List<Ticket> findByExamId(ExamId examId);
    
    /**
     * 根据考试ID和状态查找准考证
     */
    List<Ticket> findByExamIdAndStatus(ExamId examId, TicketStatus status);
    
    /**
     * 统计考试的准考证数量
     */
    long countByExamId(ExamId examId);
    
    /**
     * 统计考试中指定状态的准考证数量
     */
    long countByExamIdAndStatus(ExamId examId, TicketStatus status);
    
    /**
     * 检查准考证号是否存在
     */
    boolean existsByTicketNo(TicketNo ticketNo);
    
    /**
     * 删除准考证
     */
    void delete(TicketId id);
}

