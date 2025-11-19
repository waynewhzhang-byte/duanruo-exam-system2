package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.NotificationHistoryDTO;
import com.duanruo.exam.application.dto.NotificationStatisticsDTO;
import com.duanruo.exam.application.port.NotificationPort;
import com.duanruo.exam.domain.notification.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 通知历史应用服务
 */
@Service
@Transactional
public class NotificationHistoryApplicationService {

    private final NotificationHistoryRepository historyRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPort notificationPort;

    public NotificationHistoryApplicationService(
            NotificationHistoryRepository historyRepository,
            NotificationTemplateRepository templateRepository,
            NotificationPort notificationPort) {
        this.historyRepository = historyRepository;
        this.templateRepository = templateRepository;
        this.notificationPort = notificationPort;
    }

    /**
     * 记录通知历史
     */
    public NotificationHistoryDTO recordNotification(
            String templateCode,
            String channel,
            String recipient,
            UUID recipientUserId,
            Map<String, Object> variables) {
        
        // 获取模板
        NotificationTemplate template = templateRepository.findByCode(templateCode)
                .orElseThrow(() -> new IllegalArgumentException("模板不存在: " + templateCode));

        // 渲染模板
        String renderedContent = template.render(variables);
        String renderedSubject = template.renderSubject(variables);

        // 创建历史记录
        NotificationChannel channelEnum = NotificationChannel.fromCode(channel);
        NotificationHistory history = NotificationHistory.create(
            templateCode,
            channelEnum,
            recipient,
            recipientUserId,
            renderedSubject,
            renderedContent,
            variables
        );

        historyRepository.save(history);

        return toDTO(history);
    }

    /**
     * 更新通知状态为发送中
     */
    public void markAsSending(UUID historyId) {
        NotificationHistory history = historyRepository.findById(NotificationHistoryId.of(historyId))
                .orElseThrow(() -> new IllegalArgumentException("通知历史不存在"));

        history.markAsSending();
        historyRepository.save(history);
    }

    /**
     * 更新通知状态为成功
     */
    public void markAsSuccess(UUID historyId) {
        NotificationHistory history = historyRepository.findById(NotificationHistoryId.of(historyId))
                .orElseThrow(() -> new IllegalArgumentException("通知历史不存在"));

        history.markAsSuccess();
        historyRepository.save(history);
    }

    /**
     * 更新通知状态为失败
     */
    public void markAsFailed(UUID historyId, String errorMessage) {
        NotificationHistory history = historyRepository.findById(NotificationHistoryId.of(historyId))
                .orElseThrow(() -> new IllegalArgumentException("通知历史不存在"));

        history.markAsFailed(errorMessage);
        historyRepository.save(history);
    }

    /**
     * 重发通知
     */
    public void resendNotification(UUID historyId) {
        NotificationHistory history = historyRepository.findById(NotificationHistoryId.of(historyId))
                .orElseThrow(() -> new IllegalArgumentException("通知历史不存在"));

        // 检查是否可以重试
        if (!history.canRetry(3)) {
            throw new IllegalStateException("通知已达到最大重试次数或状态不允许重试");
        }

        // 增加重试次数
        history.incrementRetryCount();
        history.markAsSending();
        historyRepository.save(history);

        // 重新发送
        try {
            NotificationPort.Channel portChannel = toPortChannel(history.getChannel());
            notificationPort.sendToAddress(
                portChannel,
                history.getRecipient(),
                history.getTemplateCode(),
                history.getVariables()
            );
            
            history.markAsSuccess();
        } catch (Exception e) {
            history.markAsFailed(e.getMessage());
        }
        
        historyRepository.save(history);
    }

    /**
     * 根据ID获取通知历史
     */
    @Transactional(readOnly = true)
    public NotificationHistoryDTO getById(UUID id) {
        NotificationHistory history = historyRepository.findById(NotificationHistoryId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("通知历史不存在"));
        return toDTO(history);
    }

    /**
     * 根据用户ID获取通知历史
     */
    @Transactional(readOnly = true)
    public List<NotificationHistoryDTO> listByUserId(UUID userId) {
        return historyRepository.findByRecipientUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根据条件查询通知历史（分页）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> queryByConditions(
            UUID recipientUserId,
            String channel,
            String status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int page,
            int size) {
        
        NotificationChannel channelEnum = channel != null ? NotificationChannel.fromCode(channel) : null;
        NotificationStatus statusEnum = status != null ? NotificationStatus.fromCode(status) : null;

        List<NotificationHistory> histories = historyRepository.findByConditions(
            recipientUserId,
            channelEnum,
            statusEnum,
            startTime,
            endTime,
            page,
            size
        );

        long total = historyRepository.countByConditions(
            recipientUserId,
            channelEnum,
            statusEnum,
            startTime,
            endTime
        );

        List<NotificationHistoryDTO> items = histories.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return Map.of(
            "items", items,
            "total", total,
            "page", page,
            "size", size,
            "totalPages", (total + size - 1) / size
        );
    }

    /**
     * 获取通知统计信息
     */
    @Transactional(readOnly = true)
    public NotificationStatisticsDTO getStatistics() {
        long totalCount = historyRepository.findAll().size();
        long pendingCount = historyRepository.countByStatus(NotificationStatus.PENDING);
        long sendingCount = historyRepository.countByStatus(NotificationStatus.SENDING);
        long successCount = historyRepository.countByStatus(NotificationStatus.SUCCESS);
        long failedCount = historyRepository.countByStatus(NotificationStatus.FAILED);

        Map<String, Long> channelCounts = new HashMap<>();
        channelCounts.put("email", historyRepository.countByChannel(NotificationChannel.EMAIL));
        channelCounts.put("sms", historyRepository.countByChannel(NotificationChannel.SMS));
        channelCounts.put("in_app", historyRepository.countByChannel(NotificationChannel.IN_APP));

        double successRate = totalCount > 0 ? (double) successCount / totalCount * 100 : 0.0;

        return new NotificationStatisticsDTO(
            totalCount,
            pendingCount,
            sendingCount,
            successCount,
            failedCount,
            channelCounts,
            successRate
        );
    }

    /**
     * 删除通知历史
     */
    public void delete(UUID id) {
        historyRepository.delete(NotificationHistoryId.of(id));
    }

    // Helper methods

    private NotificationHistoryDTO toDTO(NotificationHistory history) {
        return new NotificationHistoryDTO(
            history.getId().getValue(),
            history.getTemplateCode(),
            history.getChannel().getCode(),
            history.getRecipient(),
            history.getRecipientUserId(),
            history.getSubject(),
            history.getContent(),
            history.getVariables(),
            history.getStatus().getCode(),
            history.getErrorMessage(),
            history.getSentAt(),
            history.getDeliveredAt(),
            history.getRetryCount(),
            history.getCreatedAt()
        );
    }

    private NotificationPort.Channel toPortChannel(NotificationChannel channel) {
        return switch (channel) {
            case EMAIL -> NotificationPort.Channel.EMAIL;
            case SMS -> NotificationPort.Channel.SMS;
            case IN_APP -> NotificationPort.Channel.IN_APP;
        };
    }
}

