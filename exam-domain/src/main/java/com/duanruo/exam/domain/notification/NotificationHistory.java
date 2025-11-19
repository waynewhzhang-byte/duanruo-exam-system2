package com.duanruo.exam.domain.notification;

import com.duanruo.exam.shared.domain.AggregateRoot;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 通知历史聚合根
 */
public class NotificationHistory extends AggregateRoot<NotificationHistoryId> {

    private String templateCode;           // 模板代码
    private NotificationChannel channel;   // 通知渠道
    private String recipient;              // 接收人（邮箱/手机号/用户ID）
    private UUID recipientUserId;          // 接收人用户ID（可选）
    private String subject;                // 主题（渲染后）
    private String content;                // 内容（渲染后）
    private Map<String, Object> variables; // 变量值
    private NotificationStatus status;     // 发送状态
    private String errorMessage;           // 错误信息
    private LocalDateTime sentAt;          // 发送时间
    private LocalDateTime deliveredAt;     // 送达时间
    private Integer retryCount;            // 重试次数
    private LocalDateTime createdAt;

    protected NotificationHistory() {
        super();
    }

    /**
     * 创建通知历史
     */
    public static NotificationHistory create(
            String templateCode,
            NotificationChannel channel,
            String recipient,
            UUID recipientUserId,
            String subject,
            String content,
            Map<String, Object> variables) {
        
        NotificationHistory history = new NotificationHistory();
        history.setId(NotificationHistoryId.newNotificationHistoryId());
        history.templateCode = templateCode;
        history.channel = channel;
        history.recipient = recipient;
        history.recipientUserId = recipientUserId;
        history.subject = subject;
        history.content = content;
        history.variables = variables != null ? new HashMap<>(variables) : new HashMap<>();
        history.status = NotificationStatus.PENDING;
        history.errorMessage = null;
        history.sentAt = null;
        history.deliveredAt = null;
        history.retryCount = 0;
        history.createdAt = LocalDateTime.now();

        return history;
    }

    /**
     * 重建通知历史（从持久化存储）
     */
    public static NotificationHistory rebuild(
            NotificationHistoryId id,
            String templateCode,
            NotificationChannel channel,
            String recipient,
            UUID recipientUserId,
            String subject,
            String content,
            Map<String, Object> variables,
            NotificationStatus status,
            String errorMessage,
            LocalDateTime sentAt,
            LocalDateTime deliveredAt,
            Integer retryCount,
            LocalDateTime createdAt) {
        
        NotificationHistory history = new NotificationHistory();
        history.setId(id);
        history.templateCode = templateCode;
        history.channel = channel;
        history.recipient = recipient;
        history.recipientUserId = recipientUserId;
        history.subject = subject;
        history.content = content;
        history.variables = variables != null ? new HashMap<>(variables) : new HashMap<>();
        history.status = status;
        history.errorMessage = errorMessage;
        history.sentAt = sentAt;
        history.deliveredAt = deliveredAt;
        history.retryCount = retryCount;
        history.createdAt = createdAt;

        return history;
    }

    /**
     * 标记为发送中
     */
    public void markAsSending() {
        this.status = NotificationStatus.SENDING;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * 标记为发送成功
     */
    public void markAsSuccess() {
        this.status = NotificationStatus.SUCCESS;
        this.deliveredAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    /**
     * 标记为发送失败
     */
    public void markAsFailed(String errorMessage) {
        this.status = NotificationStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    /**
     * 增加重试次数
     */
    public void incrementRetryCount() {
        this.retryCount++;
    }

    /**
     * 是否可以重试
     */
    public boolean canRetry(int maxRetries) {
        return this.retryCount < maxRetries && 
               (this.status == NotificationStatus.FAILED || this.status == NotificationStatus.PENDING);
    }

    // Getters

    public String getTemplateCode() {
        return templateCode;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public String getRecipient() {
        return recipient;
    }

    public UUID getRecipientUserId() {
        return recipientUserId;
    }

    public String getSubject() {
        return subject;
    }

    public String getContent() {
        return content;
    }

    public Map<String, Object> getVariables() {
        return new HashMap<>(variables);
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

