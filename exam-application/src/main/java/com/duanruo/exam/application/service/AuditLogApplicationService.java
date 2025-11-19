package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.AuditLogDTO;
import com.duanruo.exam.application.dto.AuditLogQueryRequest;
import com.duanruo.exam.domain.audit.*;
import com.duanruo.exam.domain.user.UserId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 审计日志应用服务
 */
@Service
@Transactional(readOnly = true)
public class AuditLogApplicationService {
    
    private final AuditLogRepository auditLogRepository;
    
    public AuditLogApplicationService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    
    /**
     * 记录审计日志
     */
    @Transactional
    public void log(AuditLog auditLog) {
        auditLogRepository.save(auditLog);
    }
    
    /**
     * 查询审计日志
     */
    public List<AuditLogDTO> query(AuditLogQueryRequest request) {
        List<AuditLog> logs = auditLogRepository.findByConditions(
            request.getTenantId(),
            request.getUserId() != null ? UserId.of(request.getUserId()) : null,
            request.getAction(),
            request.getResult(),
            request.getStartTime(),
            request.getEndTime(),
            request.getPage(),
            request.getSize()
        );
        
        return logs.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 根据租户ID查询
     */
    public List<AuditLogDTO> findByTenantId(UUID tenantId, int page, int size) {
        List<AuditLog> logs = auditLogRepository.findByTenantId(tenantId, page, size);
        return logs.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 根据用户ID查询
     */
    public List<AuditLogDTO> findByUserId(UUID userId, int page, int size) {
        List<AuditLog> logs = auditLogRepository.findByUserId(UserId.of(userId), page, size);
        return logs.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 根据资源查询
     */
    public List<AuditLogDTO> findByResource(String resourceType, String resourceId, int page, int size) {
        List<AuditLog> logs = auditLogRepository.findByResource(resourceType, resourceId, page, size);
        return logs.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 统计租户审计日志数量
     */
    public long countByTenantId(UUID tenantId) {
        return auditLogRepository.countByTenantId(tenantId);
    }
    
    private AuditLogDTO toDTO(AuditLog log) {
        return new AuditLogDTO(
            log.getId(),
            log.getTenantId(),
            log.getUserId() != null ? log.getUserId().getValue() : null,
            log.getUsername(),
            log.getAction(),
            log.getResourceType(),
            log.getResourceId(),
            log.getRequiredPermission() != null ? log.getRequiredPermission().name() : null,
            log.getResult(),
            log.getIpAddress(),
            log.getUserAgent(),
            log.getRequestMethod(),
            log.getRequestPath(),
            log.getRequestParams(),
            log.getResponseStatus(),
            log.getErrorMessage(),
            log.getTimestamp(),
            log.getExecutionTimeMs()
        );
    }
}

