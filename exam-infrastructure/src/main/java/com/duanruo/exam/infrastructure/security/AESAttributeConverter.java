package com.duanruo.exam.infrastructure.security;

import com.duanruo.exam.shared.security.AESUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * JPA属性转换器，用于自动加密/解密敏感字段
 * 注意：不能使用 @Component，因为 JPA Converter 需要无参构造函数
 * 加密密钥通过静态变量注入
 */
@Converter
public class AESAttributeConverter implements AttributeConverter<String, String> {

    private static final Logger logger = LoggerFactory.getLogger(AESAttributeConverter.class);

    // 静态变量存储加密密钥，由 EncryptionKeyInjector 注入
    private static String encryptionKey;

    /**
     * 设置加密密钥（由 Spring 容器调用）
     */
    public static void setEncryptionKey(String key) {
        encryptionKey = key;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }

        if (encryptionKey == null || encryptionKey.isEmpty()) {
            logger.warn("Encryption key not set, storing data in plain text");
            return attribute;
        }

        try {
            return AESUtil.encrypt(attribute, encryptionKey);
        } catch (Exception e) {
            logger.error("Failed to encrypt attribute", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }

        if (encryptionKey == null || encryptionKey.isEmpty()) {
            logger.warn("Encryption key not set, returning data as-is");
            return dbData;
        }

        // 智能检测：如果数据不是有效的Base64格式，则认为是明文
        if (!isValidBase64(dbData)) {
            logger.debug("Data is not encrypted (not valid Base64), returning as plain text");
            return dbData;
        }

        try {
            return AESUtil.decrypt(dbData, encryptionKey);
        } catch (Exception e) {
            // 解密失败，可能是明文数据，直接返回
            logger.warn("Failed to decrypt attribute, returning as plain text. Error: {}", e.getMessage());
            return dbData;
        }
    }

    /**
     * 检查字符串是否是有效的Base64格式
     * Base64只包含: A-Z, a-z, 0-9, +, /, = (padding)
     */
    private boolean isValidBase64(String str) {
        if (str == null || str.isEmpty()) {
            return false;
        }

        // Base64字符串长度必须是4的倍数（考虑padding）
        if (str.length() % 4 != 0) {
            return false;
        }

        // 检查是否只包含Base64字符
        return str.matches("^[A-Za-z0-9+/]*={0,2}$");
    }
}
