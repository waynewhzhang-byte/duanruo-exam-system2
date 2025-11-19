package com.duanruo.exam.adapter.rest.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Jackson配置类，专门处理LocalDateTime序列化/反序列化
 */
@Configuration
public class JacksonConfig {

    private static final String DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(DATE_TIME_PATTERN);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME; // 兼容 'T'

    // 兼容解析：同时支持 "yyyy-MM-dd HH:mm:ss" 与 ISO_LOCAL_DATE_TIME（含 'T'）
    static class LenientLocalDateTimeDeserializer extends StdDeserializer<LocalDateTime> {
        protected LenientLocalDateTimeDeserializer() {
            super(LocalDateTime.class);
        }
        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String text = p.getText();
            if (text == null || text.isBlank()) return null;
            // 尝试标准格式（空格）
            try { return LocalDateTime.parse(text, DATE_TIME_FORMATTER); } catch (Exception ignored) {}
            // 尝试ISO格式（含 'T'）
            try { return LocalDateTime.parse(text, ISO_FORMATTER); } catch (Exception ignored) {}
            // 最后抛出格式异常
            throw ctxt.weirdStringException(text, handledType(), "无法解析 LocalDateTime，支持格式: 'yyyy-MM-dd HH:mm:ss' 或 ISO_LOCAL_DATE_TIME");
        }
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // 创建JavaTimeModule并配置LocalDateTime的序列化/反序列化
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        // 序列化仍统一输出空格格式，满足对外契约
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DATE_TIME_FORMATTER));
        // 反序列化兼容 'T' 与空格两种输入
        javaTimeModule.addDeserializer(LocalDateTime.class, new LenientLocalDateTimeDeserializer());

        mapper.registerModule(javaTimeModule);

        // 禁用时间戳格式
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
}
