package com.duanruo.exam.shared.security;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES加密工具类
 * 用于敏感数据的加密和解密
 */
public class AESUtil {
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;
    
    /**
     * 生成AES密钥
     */
    public static String generateKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
        keyGenerator.init(256);
        SecretKey secretKey = keyGenerator.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }
    
    /**
     * 加密数据
     * 
     * @param plainText 明文
     * @param key Base64编码的密钥
     * @return Base64编码的密文（包含IV）
     */
    public static String encrypt(String plainText, String key) throws Exception {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }

        SecretKeySpec secretKey = deriveKey(key);

        // 生成随机IV
        byte[] iv = new byte[IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        // 将IV和密文合并
        byte[] encryptedWithIv = new byte[IV_LENGTH + encrypted.length];
        System.arraycopy(iv, 0, encryptedWithIv, 0, IV_LENGTH);
        System.arraycopy(encrypted, 0, encryptedWithIv, IV_LENGTH, encrypted.length);

        return Base64.getEncoder().encodeToString(encryptedWithIv);
    }
    
    /**
     * 解密数据
     * 
     * @param encryptedText Base64编码的密文（包含IV）
     * @param key Base64编码的密钥
     * @return 明文
     */
    public static String decrypt(String encryptedText, String key) throws Exception {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }

        SecretKeySpec secretKey = deriveKey(key);

        byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);

        // 提取IV
        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(encryptedWithIv, 0, iv, 0, IV_LENGTH);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // 提取密文
        byte[] encrypted = new byte[encryptedWithIv.length - IV_LENGTH];
        System.arraycopy(encryptedWithIv, IV_LENGTH, encrypted, 0, encrypted.length);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

        byte[] decrypted = cipher.doFinal(encrypted);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
    
    /**
     * 生成数据的哈希值（用于查重）
     */
    public static String hash(String data) {
        if (data == null || data.isEmpty()) {
            return data;
        }

        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash data", e);
        }
    }

    // 尝试将配置的key解析为Base64；如果失败，则对原始字符串做SHA-256以得到32字节密钥
    private static SecretKeySpec deriveKey(String key) throws Exception {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(key);
        } catch (IllegalArgumentException ex) {
            // 不是Base64，回退到从原始字符串派生
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            keyBytes = md.digest(key.getBytes(StandardCharsets.UTF_8));
        }
        // 仅取前32字节（256位）
        if (keyBytes.length >= 32) {
            byte[] k = new byte[32];
            System.arraycopy(keyBytes, 0, k, 0, 32);
            return new SecretKeySpec(k, ALGORITHM);
        } else if (keyBytes.length == 16) {
            return new SecretKeySpec(keyBytes, ALGORITHM);
        } else {
            // 不足长度，进行零填充到16或32
            int target = keyBytes.length <= 16 ? 16 : 32;
            byte[] k = new byte[target];
            System.arraycopy(keyBytes, 0, k, 0, keyBytes.length);
            return new SecretKeySpec(k, ALGORITHM);
        }
    }
}

