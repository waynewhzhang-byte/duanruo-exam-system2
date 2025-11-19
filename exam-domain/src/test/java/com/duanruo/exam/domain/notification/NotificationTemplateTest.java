package com.duanruo.exam.domain.notification;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 通知模板单元测试
 */
class NotificationTemplateTest {

    @Test
    void create_shouldCreateTemplateWithValidData() {
        // Given
        String code = "TEST_TEMPLATE";
        String name = "测试模板";
        NotificationChannel channel = NotificationChannel.EMAIL;
        String subject = "测试主题";
        String content = "您好，${name}！您的报名编号是 ${applicationId}。";
        String createdBy = "admin";

        // When
        NotificationTemplate template = NotificationTemplate.create(
            code, name, channel, subject, content, createdBy
        );

        // Then
        assertNotNull(template);
        assertNotNull(template.getId());
        assertEquals(code, template.getCode());
        assertEquals(name, template.getName());
        assertEquals(channel, template.getChannel());
        assertEquals(subject, template.getSubject());
        assertEquals(content, template.getContent());
        assertEquals(TemplateStatus.ACTIVE, template.getStatus());
        assertEquals(createdBy, template.getCreatedBy());
        
        // 验证变量提取
        Map<String, String> variables = template.getVariables();
        assertTrue(variables.containsKey("name"));
        assertTrue(variables.containsKey("applicationId"));
    }

    @Test
    void create_shouldThrowException_whenCodeIsNull() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create(null, "name", NotificationChannel.EMAIL, "subject", "content", "admin")
        );
    }

    @Test
    void create_shouldThrowException_whenCodeIsEmpty() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create("", "name", NotificationChannel.EMAIL, "subject", "content", "admin")
        );
    }

    @Test
    void create_shouldThrowException_whenCodeHasInvalidFormat() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create("invalid-code", "name", NotificationChannel.EMAIL, "subject", "content", "admin")
        );
    }

    @Test
    void create_shouldThrowException_whenNameIsNull() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create("CODE", null, NotificationChannel.EMAIL, "subject", "content", "admin")
        );
    }

    @Test
    void create_shouldThrowException_whenChannelIsNull() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create("CODE", "name", null, "subject", "content", "admin")
        );
    }

    @Test
    void create_shouldThrowException_whenContentIsNull() {
        assertThrows(NotificationTemplate.TemplateCreationException.class, () ->
            NotificationTemplate.create("CODE", "name", NotificationChannel.EMAIL, "subject", null, "admin")
        );
    }

    @Test
    void update_shouldUpdateTemplateFields() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject", "content", "admin"
        );
        
        String newName = "新名称";
        String newSubject = "新主题";
        String newContent = "新内容 ${var1}";
        String updatedBy = "user";

        // When
        template.update(newName, newSubject, newContent, updatedBy);

        // Then
        assertEquals(newName, template.getName());
        assertEquals(newSubject, template.getSubject());
        assertEquals(newContent, template.getContent());
        assertEquals(updatedBy, template.getUpdatedBy());
        
        // 验证变量重新提取
        assertTrue(template.getVariables().containsKey("var1"));
    }

    @Test
    void activate_shouldSetStatusToActive() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject", "content", "admin"
        );
        template.deactivate("admin");

        // When
        template.activate("user");

        // Then
        assertEquals(TemplateStatus.ACTIVE, template.getStatus());
        assertEquals("user", template.getUpdatedBy());
    }

    @Test
    void deactivate_shouldSetStatusToInactive() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject", "content", "admin"
        );

        // When
        template.deactivate("user");

        // Then
        assertEquals(TemplateStatus.INACTIVE, template.getStatus());
        assertEquals("user", template.getUpdatedBy());
    }

    @Test
    void render_shouldReplaceVariables() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject",
            "您好，${name}！您的报名编号是 ${applicationId}。",
            "admin"
        );
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "张三");
        variables.put("applicationId", "APP123");

        // When
        String rendered = template.render(variables);

        // Then
        assertEquals("您好，张三！您的报名编号是 APP123。", rendered);
    }

    @Test
    void render_shouldThrowException_whenVariableMissing() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject",
            "您好，${name}！",
            "admin"
        );
        
        Map<String, Object> variables = new HashMap<>();
        // 缺少 name 变量

        // When & Then
        assertThrows(NotificationTemplate.TemplateRenderException.class, () ->
            template.render(variables)
        );
    }

    @Test
    void render_shouldThrowException_whenTemplateInactive() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject", "content", "admin"
        );
        template.deactivate("admin");
        
        Map<String, Object> variables = new HashMap<>();

        // When & Then
        assertThrows(NotificationTemplate.TemplateRenderException.class, () ->
            template.render(variables)
        );
    }

    @Test
    void renderSubject_shouldReplaceVariables() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL,
            "【考试报名】${examTitle}",
            "content",
            "admin"
        );
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("examTitle", "2024年公务员考试");

        // When
        String rendered = template.renderSubject(variables);

        // Then
        assertEquals("【考试报名】2024年公务员考试", rendered);
    }

    @Test
    void renderSubject_shouldReturnNull_whenSubjectIsNull() {
        // Given
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.SMS, null, "content", "admin"
        );
        
        Map<String, Object> variables = new HashMap<>();

        // When
        String rendered = template.renderSubject(variables);

        // Then
        assertNull(rendered);
    }

    @Test
    void extractVariables_shouldExtractAllVariables() {
        // Given
        String content = "您好，${name}！您的${type}编号是 ${id}。请在${date}前完成${action}。";

        // When
        NotificationTemplate template = NotificationTemplate.create(
            "CODE", "name", NotificationChannel.EMAIL, "subject", content, "admin"
        );

        // Then
        Map<String, String> variables = template.getVariables();
        assertEquals(5, variables.size());
        assertTrue(variables.containsKey("name"));
        assertTrue(variables.containsKey("type"));
        assertTrue(variables.containsKey("id"));
        assertTrue(variables.containsKey("date"));
        assertTrue(variables.containsKey("action"));
    }
}

