package com.duanruo.exam.domain.pii;

import com.duanruo.exam.domain.user.UserId;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PII访问日志仓储接口
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
public interface PIIAccessLogRepository {
    
    /**
     * 保存PII访问日志
     */
    void save(PIIAccessLog log);
    
    /**
     * 根据用户ID查询访问日志
     * 
     * @param userId 用户ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    List<PIIAccessLog> findByUserId(UserId userId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 根据资源查询访问日志
     * 
     * @param resourceType 资源类型
     * @param resourceId 资源ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    List<PIIAccessLog> findByResource(String resourceType, String resourceId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 根据访问类型查询访问日志
     * 
     * @param accessType 访问类型
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    List<PIIAccessLog> findByAccessType(PIIAccessType accessType, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 查询所有访问日志（分页）
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @return 访问日志列表
     */
    List<PIIAccessLog> findAll(LocalDateTime startTime, LocalDateTime endTime, int page, int size);
    
    /**
     * 统计访问次数
     * 
     * @param userId 用户ID（可选）
     * @param resourceType 资源类型（可选）
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问次数
     */
    long countAccess(UserId userId, String resourceType, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 删除过期的访问日志
     * 
     * @param before 删除此时间之前的日志
     * @return 删除的记录数
     */
    int deleteOldLogs(LocalDateTime before);
}

