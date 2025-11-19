package com.duanruo.exam.bootstrap.integration;

import com.duanruo.exam.application.dto.LoginRequest;
import com.duanruo.exam.application.dto.LoginResponse;
import com.duanruo.exam.application.dto.RegisterRequest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Component;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 测试认证辅助类
 *
 * 提供用户注册、登录、获取Token等功能
 */

@Component
public class TestAuthHelper {

    /**
     * 注册用户
     */
    public void register(TestRestTemplate restTemplate, String baseUrl, RegisterRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String json;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            // Only serialize fields to avoid derived getters like isPasswordConfirmed
            mapper.setVisibility(com.fasterxml.jackson.annotation.PropertyAccessor.ALL, com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.NONE);
            mapper.setVisibility(com.fasterxml.jackson.annotation.PropertyAccessor.FIELD, com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility.ANY);
            json = mapper.writeValueAsString(request);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize RegisterRequest", e);
        }
        System.out.println("[DEBUG] RegisterRequest JSON: " + json);
        HttpEntity<String> entity = new HttpEntity<>(json, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/auth/register",
                HttpMethod.POST,
                entity,
                String.class
        );

        // Debug output on failure
        if (!HttpStatus.CREATED.equals(response.getStatusCode())) {
            System.out.println("[DEBUG] POST /auth/register -> status=" + response.getStatusCode());
            System.out.println("[DEBUG] Response headers: " + response.getHeaders());
            System.out.println("[DEBUG] Response body: " + response.getBody());
        }

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    /**
     * 登录并获取Token
     */
    public String loginAndGetToken(TestRestTemplate restTemplate, String baseUrl, String username, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<LoginRequest> entity = new HttpEntity<>(loginRequest, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/auth/login",
                HttpMethod.POST,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();

        // Use custom ObjectMapper to handle LocalDateTime pattern "yyyy-MM-dd HH:mm:ss"
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.datatype.jsr310.JavaTimeModule module = new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule();
            java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            module.addDeserializer(java.time.LocalDateTime.class, new com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer(dtf));
            module.addSerializer(java.time.LocalDateTime.class, new com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer(dtf));
            mapper.registerModule(module);
            mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            LoginResponse body = mapper.readValue(response.getBody(), LoginResponse.class);
            assertThat(body.getToken()).isNotBlank();
            String token = body.getToken();
            System.out.println("[DEBUG] Received JWT token len=" + token.length());
            // Sanity check: call /auth/me
            try {
                HttpHeaders h2 = new HttpHeaders();
                h2.setBearerAuth(token);
                HttpEntity<Void> e2 = new HttpEntity<>(h2);
                ResponseEntity<String> me = restTemplate.exchange(baseUrl + "/auth/me", HttpMethod.GET, e2, String.class);
                System.out.println("[DEBUG] GET /auth/me => " + me.getStatusCode());
            } catch (Exception ex) {
                System.out.println("[DEBUG] GET /auth/me failed: " + ex.getMessage());
            }
            return token;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse LoginResponse", e);
        }
    }

    /**
     * 创建带认证的HTTP Headers
     */
    public HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }

    /**
     * 注册并登录，返回Token
     */
    public String registerAndLogin(TestRestTemplate restTemplate, String baseUrl, RegisterRequest registerRequest) {
        register(restTemplate, baseUrl, registerRequest);
        return loginAndGetToken(restTemplate, baseUrl, registerRequest.getUsername(), registerRequest.getPassword());
    }
}

