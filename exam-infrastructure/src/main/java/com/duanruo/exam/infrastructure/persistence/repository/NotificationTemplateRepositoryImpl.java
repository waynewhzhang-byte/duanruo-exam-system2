package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.notification.*;
import com.duanruo.exam.infrastructure.persistence.entity.NotificationTemplateEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 通知模板仓储实现
 */
@Repository
@Primary
public class NotificationTemplateRepositoryImpl implements NotificationTemplateRepository {

    private final JpaNotificationTemplateRepository jpaRepository;
    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    public NotificationTemplateRepositoryImpl(JpaNotificationTemplateRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public void save(NotificationTemplate template) {
        NotificationTemplateEntity entity = toEntity(template);
        jpaRepository.save(entity);
    }

    @Override
    public Optional<NotificationTemplate> findById(NotificationTemplateId id) {
        return jpaRepository.findById(id.getValue())
                .map(this::toDomain);
    }

    @Override
    public Optional<NotificationTemplate> findByCode(String code) {
        return jpaRepository.findByCode(code)
                .map(this::toDomain);
    }

    @Override
    public List<NotificationTemplate> findByChannel(NotificationChannel channel) {
        NotificationTemplateEntity.ChannelEntity channelEntity = toChannelEntity(channel);
        return jpaRepository.findByChannel(channelEntity).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationTemplate> findByStatus(TemplateStatus status) {
        NotificationTemplateEntity.StatusEntity statusEntity = toStatusEntity(status);
        return jpaRepository.findByStatus(statusEntity).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationTemplate> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByCode(String code) {
        return jpaRepository.existsByCode(code);
    }

    @Override
    public void delete(NotificationTemplateId id) {
        jpaRepository.deleteById(id.getValue());
    }

    // Mapping methods

    private NotificationTemplateEntity toEntity(NotificationTemplate template) {
        NotificationTemplateEntity entity = new NotificationTemplateEntity();
        entity.setId(template.getId().getValue());
        entity.setCode(template.getCode());
        entity.setName(template.getName());
        entity.setChannel(toChannelEntity(template.getChannel()));
        entity.setSubject(template.getSubject());
        entity.setContent(template.getContent());
        entity.setStatus(toStatusEntity(template.getStatus()));
        
        // Convert variables Map to JsonNode
        try {
            JsonNode variablesNode = jsonMapper.valueToTree(template.getVariables());
            entity.setVariables(variablesNode);
        } catch (Exception e) {
            entity.setVariables(null);
        }
        
        entity.setCreatedAt(template.getCreatedAt());
        entity.setUpdatedAt(template.getUpdatedAt());
        entity.setCreatedBy(template.getCreatedBy());
        entity.setUpdatedBy(template.getUpdatedBy());
        
        return entity;
    }

    private NotificationTemplate toDomain(NotificationTemplateEntity entity) {
        // Convert JsonNode to Map
        Map<String, String> variables = new HashMap<>();
        if (entity.getVariables() != null) {
            try {
                variables = jsonMapper.convertValue(
                    entity.getVariables(),
                    new TypeReference<Map<String, String>>() {}
                );
            } catch (Exception e) {
                // Use empty map if conversion fails
            }
        }
        
        return NotificationTemplate.rebuild(
            NotificationTemplateId.of(entity.getId()),
            entity.getCode(),
            entity.getName(),
            toChannelDomain(entity.getChannel()),
            entity.getSubject(),
            entity.getContent(),
            toStatusDomain(entity.getStatus()),
            variables,
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getCreatedBy(),
            entity.getUpdatedBy()
        );
    }

    private NotificationTemplateEntity.ChannelEntity toChannelEntity(NotificationChannel channel) {
        return NotificationTemplateEntity.ChannelEntity.valueOf(channel.name());
    }

    private NotificationChannel toChannelDomain(NotificationTemplateEntity.ChannelEntity channelEntity) {
        return NotificationChannel.valueOf(channelEntity.name());
    }

    private NotificationTemplateEntity.StatusEntity toStatusEntity(TemplateStatus status) {
        return NotificationTemplateEntity.StatusEntity.valueOf(status.name());
    }

    private TemplateStatus toStatusDomain(NotificationTemplateEntity.StatusEntity statusEntity) {
        return TemplateStatus.valueOf(statusEntity.name());
    }
}

