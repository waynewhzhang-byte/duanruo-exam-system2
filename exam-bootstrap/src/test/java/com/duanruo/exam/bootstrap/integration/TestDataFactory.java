package com.duanruo.exam.bootstrap.integration;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.domain.exam.SubjectType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 测试数据工厂
 *
 * 提供创建各种测试数据的便捷方法
 */
@Component
public class TestDataFactory {

    /**
     * 创建测试考试
     */
    public ExamCreateRequest createExamRequest(String code, String title) {
        ExamCreateRequest request = new ExamCreateRequest();
        request.setCode(code);
        request.setTitle(title);
        request.setDescription("测试考试描述");
        request.setRegistrationStart(LocalDateTime.now().plusDays(1));
        request.setRegistrationEnd(LocalDateTime.now().plusDays(30));
        request.setFeeRequired(true);
        request.setFeeAmount(BigDecimal.valueOf(100.00));
        return request;
    }

    /**
     * 创建测试岗位
     */
    public PositionCreateRequest createPositionRequest(String code, String title) {
        PositionCreateRequest request = new PositionCreateRequest();
        request.setCode(code);
        request.setTitle(title);
        request.setDescription("测试岗位描述");
        request.setQuota(100);
        request.setRequirements("本科及以上学历，计算机相关专业");
        return request;
    }

    /**
     * 创建测试科目
     */
    public SubjectCreateRequest createSubjectRequest(String name) {
        SubjectCreateRequest request = new SubjectCreateRequest();
        request.setName(name);
        request.setDuration(120);
        request.setType(SubjectType.WRITTEN);
        request.setMaxScore(BigDecimal.valueOf(100));
        request.setPassingScore(BigDecimal.valueOf(60));
        return request;
    }

    /**
     * 创建测试用户注册请求
     */
    public RegisterRequest createRegisterRequest(String username, String email) {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("Test123!@#");
        request.setConfirmPassword("Test123!@#");
        request.setFullName("测试用户");
        request.setPhoneNumber("13800138000");
        return request;
    }

    /**
     * 创建测试登录请求
     */
    public LoginRequest createLoginRequest(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    /**
     * 创建测试报名请求
     */
    public ApplicationSubmitRequest createApplicationRequest(UUID examId, UUID positionId) {
        Map<String, Object> formData = new HashMap<>();
        formData.put("education", "本科");
        formData.put("major", "计算机科学与技术");
        formData.put("graduationYear", "2020");
        formData.put("workExperience", "3年");

        return new ApplicationSubmitRequest(
                examId,
                positionId,
                1,
                formData,
                null
        );
    }

    /**
     * 创建随机UUID字符串
     */
    public String randomUUID() {
        return UUID.randomUUID().toString();
    }

    /**
     * 创建唯一的考试代码
     */
    public String uniqueExamCode() {
        return "EXAM-" + System.currentTimeMillis();
    }

    /**
     * 创建唯一的岗位代码
     */
    public String uniquePositionCode() {
        return "POS-" + System.currentTimeMillis();
    }

    /**
     * 创建唯一的用户名
     */
    public String uniqueUsername() {
        return "user" + System.currentTimeMillis();
    }

    /**
     * 创建唯一的邮箱
     */
    public String uniqueEmail() {
        return "test" + System.currentTimeMillis() + "@example.com";
    }
}

