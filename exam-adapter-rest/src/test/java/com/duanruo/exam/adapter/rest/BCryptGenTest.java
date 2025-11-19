package com.duanruo.exam.adapter.rest;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class BCryptGenTest {
    @Test
    void generate() {
        String raw = "admin123@Abc";
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(raw);
        System.out.println("BCrypt=" + hash);
    }

    @Test
    void generateReviewerPassword() {
        String raw = "Reviewer123!@#";
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(raw);
        System.out.println("Reviewer123!@# BCrypt=" + hash);
    }

    @Test
    void generateTenantAdminPassword() {
        String raw = "TenantAdmin123!@#";
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(raw);
        System.out.println("TenantAdmin123!@# BCrypt=" + hash);
    }

    @Test
    void generateCandidatePassword() {
        String raw = "Candidate123!@#";
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(raw);
        System.out.println("Candidate123!@# BCrypt=" + hash);
    }
}

