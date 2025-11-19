package com.duanruo.exam.infrastructure.persistence;

import com.duanruo.exam.domain.pii.PIIAccessLog;
import com.duanruo.exam.domain.pii.PIIAccessLogId;
import com.duanruo.exam.domain.pii.PIIAccessLogRepository;
import com.duanruo.exam.domain.pii.PIIAccessType;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.PIIAccessLogEntity;
import com.duanruo.exam.infrastructure.persistence.jpa.JpaPIIAccessLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PII访问日志仓储实现
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
@Repository
public class PIIAccessLogRepositoryImpl implements PIIAccessLogRepository {
    
    private final JpaPIIAccessLogRepository jpaRepository;
    
    public PIIAccessLogRepositoryImpl(JpaPIIAccessLogRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }
    
    @Override
    @Transactional
    public void save(PIIAccessLog log) {
        PIIAccessLogEntity entity = toEntity(log);
        jpaRepository.save(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PIIAccessLog> findByUserId(UserId userId, LocalDateTime startTime, LocalDateTime endTime) {
        return jpaRepository.findByUserIdAndTimeRange(userId.getValue(), startTime, endTime)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PIIAccessLog> findByResource(String resourceType, String resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        return jpaRepository.findByResourceAndTimeRange(resourceType, resourceId, startTime, endTime)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PIIAccessLog> findByAccessType(PIIAccessType accessType, LocalDateTime startTime, LocalDateTime endTime) {
        return jpaRepository.findByAccessTypeAndTimeRange(accessType, startTime, endTime)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PIIAccessLog> findAll(LocalDateTime startTime, LocalDateTime endTime, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return jpaRepository.findByTimeRange(startTime, endTime, pageRequest)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countAccess(UserId userId, String resourceType, LocalDateTime startTime, LocalDateTime endTime) {
        return jpaRepository.countByConditions(
                userId != null ? userId.getValue() : null,
                resourceType,
                startTime,
                endTime
        );
    }
    
    @Override
    @Transactional
    public int deleteOldLogs(LocalDateTime before) {
        return jpaRepository.deleteByAccessedAtBefore(before);
    }
    
    /**
     * 将领域对象转换为实体
     */
    private PIIAccessLogEntity toEntity(PIIAccessLog log) {
        return new PIIAccessLogEntity(
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
    
    /**
     * 将实体转换为领域对象
     */
    private PIIAccessLog toDomain(PIIAccessLogEntity entity) {
        return PIIAccessLog.create(
                UserId.of(entity.getUserId()),
                entity.getUsername(),
                entity.getUserRole(),
                entity.getResourceType(),
                entity.getResourceId(),
                entity.getFieldName(),
                entity.getFieldType(),
                entity.getAccessType(),
                entity.getIpAddress(),
                entity.getSource(),
                entity.isMasked(),
                entity.getPurpose()
        );
    }
}

