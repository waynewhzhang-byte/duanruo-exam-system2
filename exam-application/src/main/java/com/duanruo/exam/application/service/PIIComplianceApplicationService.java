package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.PIIAccessLogDTO;
import com.duanruo.exam.domain.pii.PIIAccessLog;
import com.duanruo.exam.domain.pii.PIIAccessLogRepository;
import com.duanruo.exam.domain.pii.PIIAccessType;
import com.duanruo.exam.domain.user.UserId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PII合规应用服务
 * 提供PII数据访问审计和合规管理功能
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@Service
public class PIIComplianceApplicationService {
    
    private static final Logger logger = LoggerFactory.getLogger(PIIComplianceApplicationService.class);
    
    private final PIIAccessLogRepository accessLogRepository;
    
    public PIIComplianceApplicationService(PIIAccessLogRepository accessLogRepository) {
        this.accessLogRepository = accessLogRepository;
    }
    
    /**
     * 记录PII数据访问
     * 
     * @param userId 访问者用户ID
     * @param username 访问者用户名
     * @param userRole 访问者角色
     * @param resourceType 资源类型
     * @param resourceId 资源ID
     * @param fieldName 字段名称
     * @param fieldType 字段类型
     * @param accessType 访问类型
     * @param ipAddress IP地址
     * @param source 访问来源
     * @param masked 是否脱敏
     * @param purpose 访问目的
     */
    @Transactional
    public void logAccess(
            UUID userId,
            String username,
            String userRole,
            String resourceType,
            String resourceId,
            String fieldName,
            String fieldType,
            PIIAccessType accessType,
            String ipAddress,
            String source,
            boolean masked,
            String purpose) {
        
        try {
            PIIAccessLog log = PIIAccessLog.create(
                    UserId.of(userId),
                    username,
                    userRole,
                    resourceType,
                    resourceId,
                    fieldName,
                    fieldType,
                    accessType,
                    ipAddress,
                    source,
                    masked,
                    purpose
            );
            
            accessLogRepository.save(log);
            
            logger.debug("PII access logged: user={}, resource={}:{}, field={}, type={}, masked={}",
                    username, resourceType, resourceId, fieldName, accessType, masked);
        } catch (Exception e) {
            // 审计日志记录失败不应影响业务流程，只记录错误日志
            logger.error("Failed to log PII access", e);
        }
    }
    
    /**
     * 查询用户的访问日志
     * 
     * @param userId 用户ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    @Transactional(readOnly = true)
    public List<PIIAccessLogDTO> getUserAccessLogs(UUID userId, LocalDateTime startTime, LocalDateTime endTime) {
        List<PIIAccessLog> logs = accessLogRepository.findByUserId(UserId.of(userId), startTime, endTime);
        return logs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 查询资源的访问日志
     * 
     * @param resourceType 资源类型
     * @param resourceId 资源ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    @Transactional(readOnly = true)
    public List<PIIAccessLogDTO> getResourceAccessLogs(
            String resourceType,
            String resourceId,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        List<PIIAccessLog> logs = accessLogRepository.findByResource(resourceType, resourceId, startTime, endTime);
        return logs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 查询特定类型的访问日志
     * 
     * @param accessType 访问类型
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问日志列表
     */
    @Transactional(readOnly = true)
    public List<PIIAccessLogDTO> getAccessLogsByType(
            PIIAccessType accessType,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        List<PIIAccessLog> logs = accessLogRepository.findByAccessType(accessType, startTime, endTime);
        return logs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 查询所有访问日志（分页）
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param page 页码
     * @param size 每页大小
     * @return 访问日志列表
     */
    @Transactional(readOnly = true)
    public List<PIIAccessLogDTO> getAllAccessLogs(
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {
        List<PIIAccessLog> logs = accessLogRepository.findAll(startTime, endTime, page, size);
        return logs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 统计访问次数
     * 
     * @param userId 用户ID（可选）
     * @param resourceType 资源类型（可选）
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 访问次数
     */
    @Transactional(readOnly = true)
    public long countAccess(UUID userId, String resourceType, LocalDateTime startTime, LocalDateTime endTime) {
        return accessLogRepository.countAccess(
                userId != null ? UserId.of(userId) : null,
                resourceType,
                startTime,
                endTime
        );
    }
    
    /**
     * 清理过期的访问日志
     * 
     * @param retentionDays 保留天数
     * @return 删除的记录数
     */
    @Transactional
    public int cleanupOldLogs(int retentionDays) {
        LocalDateTime before = LocalDateTime.now().minusDays(retentionDays);
        int deleted = accessLogRepository.deleteOldLogs(before);
        logger.info("Cleaned up {} old PII access logs (before {})", deleted, before);
        return deleted;
    }
    
    /**
     * 将领域对象转换为DTO
     */
    private PIIAccessLogDTO toDTO(PIIAccessLog log) {
        return new PIIAccessLogDTO(
                log.getId().getValue(),
                log.getUserId().getValue(),
                log.getUsername(),
                log.getUserRole(),
                log.getResourceType(),
                log.getResourceId(),
                log.getFieldName(),
                log.getFieldType(),
                log.getAccessType(),
                log.getAccessedAt(),
                log.getIpAddress(),
                log.getSource(),
                log.isMasked(),
                log.getPurpose()
        );
    }
}

