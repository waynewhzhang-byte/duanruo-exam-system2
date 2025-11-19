package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.NotificationTemplateDTO;
import com.duanruo.exam.domain.notification.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 通知模板应用服务
 */
@Service
@Transactional
public class NotificationTemplateApplicationService {

    private final NotificationTemplateRepository templateRepository;

    public NotificationTemplateApplicationService(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    /**
     * 创建通知模板
     */
    public NotificationTemplateDTO create(
            String code,
            String name,
            String channel,
            String subject,
            String content,
            String createdBy) {
        
        // 检查代码是否已存在
        if (templateRepository.existsByCode(code)) {
            throw new IllegalArgumentException("模板代码已存在: " + code);
        }

        NotificationChannel channelEnum = NotificationChannel.fromCode(channel);
        
        NotificationTemplate template = NotificationTemplate.create(
            code, name, channelEnum, subject, content, createdBy
        );

        templateRepository.save(template);

        return toDTO(template);
    }

    /**
     * 更新通知模板
     */
    public NotificationTemplateDTO update(
            UUID id,
            String name,
            String subject,
            String content,
            String updatedBy) {
        
        NotificationTemplate template = templateRepository.findById(NotificationTemplateId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));

        template.update(name, subject, content, updatedBy);
        templateRepository.save(template);

        return toDTO(template);
    }

    /**
     * 激活模板
     */
    public void activate(UUID id, String updatedBy) {
        NotificationTemplate template = templateRepository.findById(NotificationTemplateId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));

        template.activate(updatedBy);
        templateRepository.save(template);
    }

    /**
     * 停用模板
     */
    public void deactivate(UUID id, String updatedBy) {
        NotificationTemplate template = templateRepository.findById(NotificationTemplateId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));

        template.deactivate(updatedBy);
        templateRepository.save(template);
    }

    /**
     * 删除模板
     */
    public void delete(UUID id) {
        templateRepository.delete(NotificationTemplateId.of(id));
    }

    /**
     * 根据ID获取模板
     */
    @Transactional(readOnly = true)
    public NotificationTemplateDTO getById(UUID id) {
        NotificationTemplate template = templateRepository.findById(NotificationTemplateId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));
        return toDTO(template);
    }

    /**
     * 根据代码获取模板
     */
    @Transactional(readOnly = true)
    public NotificationTemplateDTO getByCode(String code) {
        NotificationTemplate template = templateRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));
        return toDTO(template);
    }

    /**
     * 根据渠道获取所有模板
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> listByChannel(String channel) {
        NotificationChannel channelEnum = NotificationChannel.fromCode(channel);
        return templateRepository.findByChannel(channelEnum).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根据状态获取所有模板
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> listByStatus(String status) {
        TemplateStatus statusEnum = TemplateStatus.fromCode(status);
        return templateRepository.findByStatus(statusEnum).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有模板
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> listAll() {
        return templateRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 预览模板（渲染变量）
     */
    @Transactional(readOnly = true)
    public Map<String, String> preview(UUID id, Map<String, Object> variables) {
        NotificationTemplate template = templateRepository.findById(NotificationTemplateId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("模板不存在"));

        String renderedContent = template.render(variables);
        String renderedSubject = template.renderSubject(variables);

        return Map.of(
            "subject", renderedSubject != null ? renderedSubject : "",
            "content", renderedContent
        );
    }

    // Helper methods

    private NotificationTemplateDTO toDTO(NotificationTemplate template) {
        return new NotificationTemplateDTO(
            template.getId().getValue(),
            template.getCode(),
            template.getName(),
            template.getChannel().getCode(),
            template.getSubject(),
            template.getContent(),
            template.getStatus().getCode(),
            template.getVariables(),
            template.getCreatedAt(),
            template.getUpdatedAt(),
            template.getCreatedBy(),
            template.getUpdatedBy()
        );
    }
}

