package com.duanruo.exam.infrastructure.config;

import com.duanruo.exam.infrastructure.security.AESAttributeConverter;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 加密密钥注入器
 * 在应用启动时将加密密钥注入到 AESAttributeConverter
 */
@Component
public class EncryptionKeyInjector {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionKeyInjector.class);

    @Value("${app.encryption.key}")
    private String encryptionKey;

    @PostConstruct
    public void init() {
        AESAttributeConverter.setEncryptionKey(encryptionKey);
        // Log limited info to avoid leaking secrets
        if (encryptionKey != null) {
            String preview = encryptionKey.length() <= 8 ? encryptionKey : encryptionKey.substring(0, 4) + "..." + encryptionKey.substring(encryptionKey.length() - 4);
            boolean looksBase64 = encryptionKey.matches("[A-Za-z0-9+/=]+$");
            logger.info("Encryption key injected (len={} , base64Like={}) preview={}", encryptionKey.length(), looksBase64, preview);
        } else {
            logger.warn("Encryption key is null; AESAttributeConverter will bypass encryption");
        }
    }
}

