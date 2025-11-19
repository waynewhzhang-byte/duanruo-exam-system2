package com.duanruo.exam.shared.security;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 加密工具类
 * 用于敏感信息的加密和解密
 */
public class EncryptionUtil {

    private static final String AES_ALGORITHM = "AES";
    private static final String AES_TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final String SHA256_ALGORITHM = "SHA-256";
    private static final int AES_KEY_SIZE = 256;
    private static final int IV_SIZE = 16;

    /**
     * 生成AES密钥
     */
    public static String generateAesKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES_ALGORITHM);
            keyGenerator.init(AES_KEY_SIZE, new SecureRandom());
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate AES key", e);
        }
    }

    /**
     * AES加密
     * @param plainText 明文
     * @param key Base64编码的密钥
     * @return Base64编码的密文（包含IV）
     */
    public static String encryptAes(String plainText, String key) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }

        try {
            // 解码密钥
            byte[] keyBytes = Base64.getDecoder().decode(key);
            SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, AES_ALGORITHM);

            // 生成随机IV
            byte[] iv = new byte[IV_SIZE];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);

            // 加密
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // 将IV和密文合并
            byte[] combined = new byte[IV_SIZE + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encrypted, 0, combined, IV_SIZE, encrypted.length);

            // Base64编码
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * AES解密
     * @param cipherText Base64编码的密文（包含IV）
     * @param key Base64编码的密钥
     * @return 明文
     */
    public static String decryptAes(String cipherText, String key) {
        if (cipherText == null || cipherText.isEmpty()) {
            return cipherText;
        }

        try {
            // 解码密钥
            byte[] keyBytes = Base64.getDecoder().decode(key);
            SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, AES_ALGORITHM);

            // 解码密文
            byte[] combined = Base64.getDecoder().decode(cipherText);

            // 分离IV和密文
            byte[] iv = new byte[IV_SIZE];
            byte[] encrypted = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            System.arraycopy(combined, IV_SIZE, encrypted, 0, encrypted.length);

            IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);

            // 解密
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivParameterSpec);
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }

    /**
     * SHA-256哈希
     * @param input 输入字符串
     * @return Base64编码的哈希值
     */
    public static String sha256Hash(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance(SHA256_ALGORITHM);
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash data", e);
        }
    }

    /**
     * 脱敏手机号
     * 保留前3位和后4位，中间用*代替
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /**
     * 脱敏身份证号
     * 保留前6位和后4位，中间用*代替
     */
    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 10) {
            return idCard;
        }
        return idCard.substring(0, 6) + "********" + idCard.substring(idCard.length() - 4);
    }

    /**
     * 脱敏邮箱
     * 保留邮箱前缀的前2个字符和@后的域名
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) {
            return email;
        }
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }

    /**
     * 脱敏姓名
     * 保留姓氏，其他用*代替
     */
    public static String maskName(String name) {
        if (name == null || name.length() <= 1) {
            return name;
        }
        StringBuilder masked = new StringBuilder();
        masked.append(name.charAt(0));
        for (int i = 1; i < name.length(); i++) {
            masked.append("*");
        }
        return masked.toString();
    }

    /**
     * 生成随机盐值
     */
    public static String generateSalt() {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    /**
     * 带盐值的哈希
     */
    public static String hashWithSalt(String input, String salt) {
        return sha256Hash(input + salt);
    }

    /**
     * 验证带盐值的哈希
     */
    public static boolean verifyHashWithSalt(String input, String salt, String hash) {
        String computed = hashWithSalt(input, salt);
        return computed.equals(hash);
    }
}

