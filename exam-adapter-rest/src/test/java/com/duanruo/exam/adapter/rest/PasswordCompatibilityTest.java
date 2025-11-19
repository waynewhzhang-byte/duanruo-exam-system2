package com.duanruo.exam.adapter.rest;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 测试Spring Security BCryptPasswordEncoder与pgcrypto生成的bcrypt哈希的兼容性
 */
public class PasswordCompatibilityTest {

    @Test
    void testPgcryptoBcryptCompatibility() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // 这是从数据库中获取的实际哈希值（由pgcrypto的crypt函数生成）
        String pgcryptoHash = "$2a$06$e0vpow3QKSziKf8DuHxY/uvMnVL6zsEPhYhOolo3ykgTZYITpyY3a";
        String password = "admin123@Abc";
        
        // 测试Spring Security的BCryptPasswordEncoder是否能验证pgcrypto生成的哈希
        boolean matches = encoder.matches(password, pgcryptoHash);
        
        System.out.println("Password: " + password);
        System.out.println("Pgcrypto Hash: " + pgcryptoHash);
        System.out.println("Spring Security BCrypt matches: " + matches);
        
        assertTrue(matches, "Spring Security BCryptPasswordEncoder should be able to verify pgcrypto bcrypt hashes");
    }
    
    @Test
    void testSpringSecurityBcryptGeneration() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "admin123@Abc";
        
        // 生成Spring Security的bcrypt哈希
        String springHash = encoder.encode(password);
        
        System.out.println("Password: " + password);
        System.out.println("Spring Security Hash: " + springHash);
        
        // 验证Spring Security生成的哈希
        boolean matches = encoder.matches(password, springHash);
        assertTrue(matches, "Spring Security should be able to verify its own hashes");
    }
    
    @Test
    void testDifferentBcryptVersions() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();

        // 测试不同版本的bcrypt哈希
        String[] testHashes = {
            "$2a$06$e0vpow3QKSziKf8DuHxY/uvMnVL6zsEPhYhOolo3ykgTZYITpyY3a", // pgcrypto生成的
            "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.", // 硬编码的
        };

        String[] testPasswords = {"admin123@Abc", "password", "admin123", "admin", "secret"};

        for (String hash : testHashes) {
            System.out.println("Testing hash: " + hash);
            for (String pwd : testPasswords) {
                try {
                    boolean matches = encoder.matches(pwd, hash);
                    if (matches) {
                        System.out.println("  ✅ Matches '" + pwd + "': " + matches);
                    } else {
                        System.out.println("  ❌ Matches '" + pwd + "': " + matches);
                    }
                } catch (Exception e) {
                    System.out.println("  Error with '" + pwd + "': " + e.getMessage());
                }
            }
            System.out.println();
        }
    }
}
