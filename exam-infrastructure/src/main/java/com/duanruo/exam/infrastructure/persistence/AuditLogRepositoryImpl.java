package com.duanruo.exam.infrastructure.persistence;

import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditLog;
import com.duanruo.exam.domain.audit.AuditLogRepository;
import com.duanruo.exam.domain.audit.AuditResult;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.AuditLogEntity;
import com.duanruo.exam.infrastructure.persistence.jpa.JpaAuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 审计日志仓储实现
 * 
 * @author Augment Agent
 * @since 2025-10-25
 */
@Repository
public class AuditLogRepositoryImpl implements AuditLogRepository {
    
    private final JpaAuditLogRepository jpaRepository;
    
    public AuditLogRepositoryImpl(JpaAuditLogRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }
    
    @Override
    @Transactional
    public void save(AuditLog auditLog) {
        AuditLogEntity entity = toEntity(auditLog);
        jpaRepository.save(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AuditLog findById(UUID id) {
        return jpaRepository.findById(id)
                .map(this::toDomain)
                .orElse(null);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByTenantId(UUID tenantId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByTenantId(tenantId, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByUserId(UserId userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByUserId(userId.getValue(), pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByAction(AuditAction action, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByAction(action, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByResult(AuditResult result, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByResult(result, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByTimeRange(LocalDateTime start, LocalDateTime end, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByTimeRange(start, end, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByResource(String resourceType, String resourceId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByResource(resourceType, resourceId, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByConditions(
            UUID tenantId,
            UserId userId,
            AuditAction action,
            AuditResult result,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByConditions(
                tenantId,
                userId != null ? userId.getValue() : null,
                action,
                result,
                startTime,
                endTime,
                pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countByTenantId(UUID tenantId) {
        return jpaRepository.countByTenantId(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countFailuresByTenantId(UUID tenantId, LocalDateTime since) {
        return jpaRepository.countFailuresByTenantId(tenantId, since);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPermissionDeniedByTenantId(UUID tenantId, LocalDateTime since) {
        return jpaRepository.countPermissionDeniedByTenantId(tenantId, since);
    }
    
    /**
     * 将领域对象转换为实体
     */
    private AuditLogEntity toEntity(AuditLog log) {
        return new AuditLogEntity(
                log.getId(),
                log.getTenantId(),
                log.getUserId() != null ? log.getUserId().getValue() : null,
                log.getUsername(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getRequiredPermission(),
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
    
    /**
     * 将实体转换为领域对象
     */
    private AuditLog toDomain(AuditLogEntity entity) {
        return AuditLog.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .userId(entity.getUserId() != null ? UserId.of(entity.getUserId()) : null)
                .username(entity.getUsername())
                .action(entity.getAction())
                .resourceType(entity.getResourceType())
                .resourceId(entity.getResourceId())
                .requiredPermission(entity.getRequiredPermission())
                .result(entity.getResult())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .requestMethod(entity.getRequestMethod())
                .requestPath(entity.getRequestPath())
                .requestParams(entity.getRequestParams())
                .responseStatus(entity.getResponseStatus())
                .errorMessage(entity.getErrorMessage())
                .timestamp(entity.getTimestamp())
                .executionTimeMs(entity.getExecutionTimeMs())
                .build();
    }
}

