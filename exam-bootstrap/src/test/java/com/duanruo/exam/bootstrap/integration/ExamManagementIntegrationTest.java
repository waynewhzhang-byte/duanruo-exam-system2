package com.duanruo.exam.bootstrap.integration;

import com.duanruo.exam.application.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 考试管理流程集成测试
 * 
 * 测试场景:
 * 1. 创建考试 → 添加岗位 → 添加科目 → 发布考试
 * 2. 更新考试信息 → 查询考试详情
 * 3. 多租户隔离验证
 * 4. 权限控制验证
 */
class ExamManagementIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestDataFactory dataFactory;

    @Autowired
    private TestAuthHelper authHelper;

    private String adminToken;
    private String candidateToken;

    @BeforeEach
    void setUp() {
        // 通过引导端点创建首个超级管理员（仅首次有效）
        RegisterRequest adminRegister = dataFactory.createRegisterRequest(
                dataFactory.uniqueUsername(),
                dataFactory.uniqueEmail()
        );
        // 调用引导端点创建首个超级管理员
        {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.add("X-Bootstrap-Token", "integration-bootstrap-token");
            String json;
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                mapper.setVisibility(com.fasterxml.jackson.annotation.PropertyAccessor.ALL, com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.NONE);
                mapper.setVisibility(com.fasterxml.jackson.annotation.PropertyAccessor.FIELD, com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.ANY);
                json = mapper.writeValueAsString(adminRegister);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(json, headers);
            org.springframework.http.ResponseEntity<String> resp = restTemplate.exchange(
                    baseUrl("") + "/auth/bootstrap/create-initial-admin",
                    org.springframework.http.HttpMethod.POST,
                    entity,
                    String.class
            );
            if (!org.springframework.http.HttpStatus.CREATED.equals(resp.getStatusCode())) {
                System.out.println("[DEBUG] bootstrap create-initial-admin status=" + resp.getStatusCode());
                System.out.println("[DEBUG] body=" + resp.getBody());
            }
            assertThat(resp.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.CREATED);
        }
        adminToken = authHelper.loginAndGetToken(restTemplate, baseUrl(""), adminRegister.getUsername(), adminRegister.getPassword());

        // 注册并登录考生
        RegisterRequest candidateRegister = dataFactory.createRegisterRequest(
                dataFactory.uniqueUsername(),
                dataFactory.uniqueEmail()
        );
        candidateToken = authHelper.registerAndLogin(restTemplate, baseUrl(""), candidateRegister);
    }

    @Test
    void shouldCreateExamSuccessfully() {
        // Given
        ExamCreateRequest request = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "2025年公务员考试"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(adminToken);
        HttpEntity<ExamCreateRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<ExamResponse> response = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                entity,
                ExamResponse.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(request.getCode());
        assertThat(response.getBody().getTitle()).isEqualTo(request.getTitle());
        assertThat(response.getBody().getStatus()).isEqualTo("DRAFT");
    }

    @Test
    void shouldCreateExamWithPositionsAndSubjects() {
        // Given - 创建考试
        ExamCreateRequest examRequest = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "2025年事业单位考试"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(adminToken);
        HttpEntity<ExamCreateRequest> examEntity = new HttpEntity<>(examRequest, headers);

        ResponseEntity<ExamResponse> examResponse = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                examEntity,
                ExamResponse.class
        );

        assertThat(examResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID examId = UUID.fromString(examResponse.getBody().getId());

        // When - 添加岗位
        PositionCreateRequest positionRequest = dataFactory.createPositionRequest(
                dataFactory.uniquePositionCode(),
                "软件工程师"
        );
        positionRequest.setExamId(examId);

        HttpEntity<PositionCreateRequest> positionEntity = new HttpEntity<>(positionRequest, headers);

        ResponseEntity<PositionResponse> positionResponse = restTemplate.exchange(
                baseUrl("/exams/" + examId + "/positions"),
                HttpMethod.POST,
                positionEntity,
                PositionResponse.class
        );

        assertThat(positionResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID positionId = UUID.fromString(positionResponse.getBody().getId());

        // When - 添加科目
        SubjectCreateRequest subjectRequest = dataFactory.createSubjectRequest(
                "行政职业能力测验"
        );

        HttpEntity<SubjectCreateRequest> subjectEntity = new HttpEntity<>(subjectRequest, headers);

        ResponseEntity<SubjectResponse> subjectResponse = restTemplate.exchange(
                baseUrl("/positions/" + positionId + "/subjects"),
                HttpMethod.POST,
                subjectEntity,
                SubjectResponse.class
        );

        // Then
        assertThat(subjectResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(subjectResponse.getBody()).isNotNull();
        assertThat(subjectResponse.getBody().getName()).isEqualTo("行政职业能力测验");
        assertThat(subjectResponse.getBody().getDuration()).isEqualTo(120);
    }

    @Test
    void shouldGetExamDetails() {
        // Given - 创建考试
        ExamCreateRequest request = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "2025年教师招聘考试"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(adminToken);
        HttpEntity<ExamCreateRequest> createEntity = new HttpEntity<>(request, headers);

        ResponseEntity<ExamResponse> createResponse = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                createEntity,
                ExamResponse.class
        );

        String examId = createResponse.getBody().getId();

        // When - 查询考试详情
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);

        ResponseEntity<ExamResponse> getResponse = restTemplate.exchange(
                baseUrl("/exams/" + examId),
                HttpMethod.GET,
                getEntity,
                ExamResponse.class
        );

        // Then
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody()).isNotNull();
        assertThat(getResponse.getBody().getId()).isEqualTo(examId);
        assertThat(getResponse.getBody().getCode()).isEqualTo(request.getCode());
        assertThat(getResponse.getBody().getTitle()).isEqualTo(request.getTitle());
    }

    @Test
    void shouldUpdateExamInformation() {
        // Given - 创建考试
        ExamCreateRequest createRequest = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "原始标题"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(adminToken);
        HttpEntity<ExamCreateRequest> createEntity = new HttpEntity<>(createRequest, headers);

        ResponseEntity<ExamResponse> createResponse = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                createEntity,
                ExamResponse.class
        );

        String examId = createResponse.getBody().getId();

        // When - 更新考试信息
        ExamUpdateRequest updateRequest = new ExamUpdateRequest();
        updateRequest.setTitle("更新后的标题");
        updateRequest.setDescription("更新后的描述");

        HttpEntity<ExamUpdateRequest> updateEntity = new HttpEntity<>(updateRequest, headers);

        ResponseEntity<ExamResponse> updateResponse = restTemplate.exchange(
                baseUrl("/exams/" + examId),
                HttpMethod.PUT,
                updateEntity,
                ExamResponse.class
        );

        // Then
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getBody()).isNotNull();
        assertThat(updateResponse.getBody().getTitle()).isEqualTo("更新后的标题");
        assertThat(updateResponse.getBody().getDescription()).isEqualTo("更新后的描述");
    }

    @Test
    void shouldPublishExam() {
        // Given - 创建考试
        ExamCreateRequest request = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "待发布考试"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(adminToken);
        HttpEntity<ExamCreateRequest> createEntity = new HttpEntity<>(request, headers);

        ResponseEntity<ExamResponse> createResponse = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                createEntity,
                ExamResponse.class
        );

        String examId = createResponse.getBody().getId();

        // When - 发布考试
        HttpEntity<Void> publishEntity = new HttpEntity<>(headers);

        ResponseEntity<ExamResponse> publishResponse = restTemplate.exchange(
                baseUrl("/exams/" + examId + "/publish"),
                HttpMethod.POST,
                publishEntity,
                ExamResponse.class
        );

        // Then
        assertThat(publishResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(publishResponse.getBody()).isNotNull();
        assertThat(publishResponse.getBody().getStatus()).isEqualTo("OPEN");
    }

    @Test
    void shouldDenyAccessWhenNotAuthenticated() {
        // Given
        ExamCreateRequest request = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "未认证测试"
        );

        HttpHeaders headers = createHeaders(); // 不带认证
        HttpEntity<ExamCreateRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                entity,
                String.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldDenyAccessWhenInsufficientPermissions() {
        // Given - 使用考生Token（无权限创建考试）
        ExamCreateRequest request = dataFactory.createExamRequest(
                dataFactory.uniqueExamCode(),
                "权限测试"
        );

        HttpHeaders headers = authHelper.createAuthHeaders(candidateToken);
        HttpEntity<ExamCreateRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl("/exams"),
                HttpMethod.POST,
                entity,
                String.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}

