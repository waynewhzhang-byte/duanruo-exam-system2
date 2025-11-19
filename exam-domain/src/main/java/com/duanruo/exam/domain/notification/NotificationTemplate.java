package com.duanruo.exam.domain.notification;

import com.duanruo.exam.shared.domain.AggregateRoot;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 通知模板聚合根
 */
public class NotificationTemplate extends AggregateRoot<NotificationTemplateId> {

    private String code;                    // 模板代码（唯一标识）
    private String name;                    // 模板名称
    private NotificationChannel channel;    // 通知渠道
    private String subject;                 // 主题（邮件用）
    private String content;                 // 内容模板
    private TemplateStatus status;          // 模板状态
    private Map<String, String> variables;  // 变量说明（变量名 -> 说明）
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    protected NotificationTemplate() {
        super();
    }

    /**
     * 创建通知模板
     */
    public static NotificationTemplate create(
            String code,
            String name,
            NotificationChannel channel,
            String subject,
            String content,
            String createdBy) {
        
        validateCode(code);
        validateName(name);
        validateChannel(channel);
        validateContent(content);

        NotificationTemplate template = new NotificationTemplate();
        template.setId(NotificationTemplateId.newNotificationTemplateId());
        template.code = code.trim().toUpperCase();
        template.name = name.trim();
        template.channel = channel;
        template.subject = subject != null ? subject.trim() : null;
        template.content = content.trim();
        template.status = TemplateStatus.ACTIVE;
        template.variables = extractVariables(content);
        template.createdAt = LocalDateTime.now();
        template.updatedAt = LocalDateTime.now();
        template.createdBy = createdBy;
        template.updatedBy = createdBy;

        return template;
    }

    /**
     * 重建通知模板（从持久化存储）
     */
    public static NotificationTemplate rebuild(
            NotificationTemplateId id,
            String code,
            String name,
            NotificationChannel channel,
            String subject,
            String content,
            TemplateStatus status,
            Map<String, String> variables,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String createdBy,
            String updatedBy) {
        
        NotificationTemplate template = new NotificationTemplate();
        template.setId(id);
        template.code = code;
        template.name = name;
        template.channel = channel;
        template.subject = subject;
        template.content = content;
        template.status = status;
        template.variables = variables != null ? new HashMap<>(variables) : new HashMap<>();
        template.createdAt = createdAt;
        template.updatedAt = updatedAt;
        template.createdBy = createdBy;
        template.updatedBy = updatedBy;

        return template;
    }

    /**
     * 更新模板
     */
    public void update(String name, String subject, String content, String updatedBy) {
        if (name != null && !name.trim().isEmpty()) {
            validateName(name);
            this.name = name.trim();
        }
        
        if (content != null && !content.trim().isEmpty()) {
            validateContent(content);
            this.content = content.trim();
            this.variables = extractVariables(content);
        }
        
        if (subject != null) {
            this.subject = subject.trim();
        }
        
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
    }

    /**
     * 激活模板
     */
    public void activate(String updatedBy) {
        this.status = TemplateStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
    }

    /**
     * 停用模板
     */
    public void deactivate(String updatedBy) {
        this.status = TemplateStatus.INACTIVE;
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
    }

    /**
     * 渲染模板（替换变量）
     */
    public String render(Map<String, Object> variableValues) {
        if (status != TemplateStatus.ACTIVE) {
            throw new TemplateRenderException("TEMPLATE_INACTIVE", "模板未激活");
        }

        String result = content;
        
        // 替换变量 ${variableName}
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(content);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variableValues.get(variableName);
            
            if (value == null) {
                throw new TemplateRenderException("VARIABLE_MISSING", 
                    "缺少变量: " + variableName);
            }
            
            result = result.replace("${" + variableName + "}", value.toString());
        }
        
        return result;
    }

    /**
     * 渲染主题
     */
    public String renderSubject(Map<String, Object> variableValues) {
        if (subject == null || subject.isEmpty()) {
            return null;
        }

        String result = subject;
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(subject);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variableValues.get(variableName);
            
            if (value != null) {
                result = result.replace("${" + variableName + "}", value.toString());
            }
        }
        
        return result;
    }

    /**
     * 从内容中提取变量
     */
    private static Map<String, String> extractVariables(String content) {
        Map<String, String> vars = new HashMap<>();
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(content);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            vars.put(variableName, ""); // 默认空说明
        }
        
        return vars;
    }

    // 验证方法

    private static void validateCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new TemplateCreationException("CODE_REQUIRED", "模板代码不能为空");
        }
        if (code.length() > 100) {
            throw new TemplateCreationException("CODE_TOO_LONG", "模板代码不能超过100个字符");
        }
        if (!code.matches("^[A-Z0-9_]+$")) {
            throw new TemplateCreationException("CODE_INVALID_FORMAT", 
                "模板代码只能包含大写字母、数字和下划线");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new TemplateCreationException("NAME_REQUIRED", "模板名称不能为空");
        }
        if (name.length() > 200) {
            throw new TemplateCreationException("NAME_TOO_LONG", "模板名称不能超过200个字符");
        }
    }

    private static void validateChannel(NotificationChannel channel) {
        if (channel == null) {
            throw new TemplateCreationException("CHANNEL_REQUIRED", "通知渠道不能为空");
        }
    }

    private static void validateContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new TemplateCreationException("CONTENT_REQUIRED", "模板内容不能为空");
        }
        if (content.length() > 10000) {
            throw new TemplateCreationException("CONTENT_TOO_LONG", "模板内容不能超过10000个字符");
        }
    }

    // Getters

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public String getSubject() {
        return subject;
    }

    public String getContent() {
        return content;
    }

    public TemplateStatus getStatus() {
        return status;
    }

    public Map<String, String> getVariables() {
        return new HashMap<>(variables);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    // 异常类

    public static class TemplateCreationException extends DomainException {
        public TemplateCreationException(String code, String message) {
            super(code, message);
        }
    }

    public static class TemplateRenderException extends DomainException {
        public TemplateRenderException(String code, String message) {
            super(code, message);
        }
    }
}

