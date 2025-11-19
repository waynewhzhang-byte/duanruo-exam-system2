package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.notification.*;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity.ChannelEntity;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationHistoryEntity.StatusEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 通知历史仓储实现
 */
@Component
public class NotificationHistoryRepositoryImpl implements NotificationHistoryRepository {

    private final JpaNotificationHistoryRepository jpaRepository;
    private final ObjectMapper jsonMapper;

    public NotificationHistoryRepositoryImpl(
            JpaNotificationHistoryRepository jpaRepository,
            ObjectMapper jsonMapper) {
        this.jpaRepository = jpaRepository;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void save(NotificationHistory history) {
        NotificationHistoryEntity entity = toEntity(history);
        jpaRepository.save(entity);
    }

    @Override
    public Optional<NotificationHistory> findById(NotificationHistoryId id) {
        return jpaRepository.findById(id.getValue())
                .map(this::toDomain);
    }

    @Override
    public List<NotificationHistory> findByRecipientUserId(UUID userId) {
        return jpaRepository.findByRecipientUserId(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistory> findByTemplateCode(String templateCode) {
        return jpaRepository.findByTemplateCode(templateCode).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistory> findByChannel(NotificationChannel channel) {
        ChannelEntity channelEntity = toChannelEntity(channel);
        return jpaRepository.findByChannel(channelEntity).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistory> findByStatus(NotificationStatus status) {
        StatusEntity statusEntity = toStatusEntity(status);
        return jpaRepository.findByStatus(statusEntity).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistory> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime) {
        return jpaRepository.findByCreatedAtBetween(startTime, endTime).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationHistory> findByConditions(
            UUID recipientUserId,
            NotificationChannel channel,
            NotificationStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {
        
        ChannelEntity channelEntity = channel != null ? toChannelEntity(channel) : null;
        StatusEntity statusEntity = status != null ? toStatusEntity(status) : null;
        
        return jpaRepository.findByConditions(
                recipientUserId,
                channelEntity,
                statusEntity,
                startTime,
                endTime,
                PageRequest.of(page, size)
        ).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countByConditions(
            UUID recipientUserId,
            NotificationChannel channel,
            NotificationStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        
        ChannelEntity channelEntity = channel != null ? toChannelEntity(channel) : null;
        StatusEntity statusEntity = status != null ? toStatusEntity(status) : null;
        
        return jpaRepository.countByConditions(
                recipientUserId,
                channelEntity,
                statusEntity,
                startTime,
                endTime
        );
    }

    @Override
    public long countByStatus(NotificationStatus status) {
        StatusEntity statusEntity = toStatusEntity(status);
        return jpaRepository.countByStatus(statusEntity);
    }

    @Override
    public long countByChannel(NotificationChannel channel) {
        ChannelEntity channelEntity = toChannelEntity(channel);
        return jpaRepository.countByChannel(channelEntity);
    }

    @Override
    public List<NotificationHistory> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(NotificationHistoryId id) {
        jpaRepository.deleteById(id.getValue());
    }

    // Helper methods

    private NotificationHistory toDomain(NotificationHistoryEntity entity) {
        Map<String, Object> variables = new HashMap<>();
        if (entity.getVariables() != null) {
            try {
                variables = jsonMapper.convertValue(
                    entity.getVariables(),
                    new TypeReference<Map<String, Object>>() {}
                );
            } catch (Exception e) {
                // Use empty map if conversion fails
            }
        }

        return NotificationHistory.rebuild(
            NotificationHistoryId.of(entity.getId()),
            entity.getTemplateCode(),
            toChannelDomain(entity.getChannel()),
            entity.getRecipient(),
            entity.getRecipientUserId(),
            entity.getSubject(),
            entity.getContent(),
            variables,
            toStatusDomain(entity.getStatus()),
            entity.getErrorMessage(),
            entity.getSentAt(),
            entity.getDeliveredAt(),
            entity.getRetryCount(),
            entity.getCreatedAt()
        );
    }

    private NotificationHistoryEntity toEntity(NotificationHistory history) {
        NotificationHistoryEntity entity = new NotificationHistoryEntity();
        entity.setId(history.getId().getValue());
        entity.setTemplateCode(history.getTemplateCode());
        entity.setChannel(toChannelEntity(history.getChannel()));
        entity.setRecipient(history.getRecipient());
        entity.setRecipientUserId(history.getRecipientUserId());
        entity.setSubject(history.getSubject());
        entity.setContent(history.getContent());
        
        // Convert variables to JsonNode
        JsonNode variablesNode = jsonMapper.valueToTree(history.getVariables());
        entity.setVariables(variablesNode);
        
        entity.setStatus(toStatusEntity(history.getStatus()));
        entity.setErrorMessage(history.getErrorMessage());
        entity.setSentAt(history.getSentAt());
        entity.setDeliveredAt(history.getDeliveredAt());
        entity.setRetryCount(history.getRetryCount());
        entity.setCreatedAt(history.getCreatedAt());

        return entity;
    }

    private NotificationChannel toChannelDomain(ChannelEntity entity) {
        return switch (entity) {
            case EMAIL -> NotificationChannel.EMAIL;
            case SMS -> NotificationChannel.SMS;
            case IN_APP -> NotificationChannel.IN_APP;
        };
    }

    private ChannelEntity toChannelEntity(NotificationChannel domain) {
        return switch (domain) {
            case EMAIL -> ChannelEntity.EMAIL;
            case SMS -> ChannelEntity.SMS;
            case IN_APP -> ChannelEntity.IN_APP;
        };
    }

    private NotificationStatus toStatusDomain(StatusEntity entity) {
        return switch (entity) {
            case PENDING -> NotificationStatus.PENDING;
            case SENDING -> NotificationStatus.SENDING;
            case SUCCESS -> NotificationStatus.SUCCESS;
            case FAILED -> NotificationStatus.FAILED;
        };
    }

    private StatusEntity toStatusEntity(NotificationStatus domain) {
        return switch (domain) {
            case PENDING -> StatusEntity.PENDING;
            case SENDING -> StatusEntity.SENDING;
            case SUCCESS -> StatusEntity.SUCCESS;
            case FAILED -> StatusEntity.FAILED;
        };
    }
}

