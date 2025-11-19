package com.duanruo.exam.bootstrap.integration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 集成测试基类
 *
 * 提供:
 * - 本地PostgreSQL数据库配置（使用Flyway迁移）
 * - 多租户Schema管理
 * - TestRestTemplate配置
 * - 通用测试辅助方法
 *
 * 数据库架构:
 * - public schema: 存储租户表、用户表等公共数据
 * - tenant_xxx schemas: 每个租户的业务数据（考试、报名、成绩等）
 *
 * 注意: 需要本地运行PostgreSQL数据库
 * - 数据库地址: localhost:5432
 * - 数据库名: exam_test
 * - 用户名: postgres
 * - 密码: postgres
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(com.duanruo.exam.bootstrap.integration.config.TestSecurityOverrides.class)
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected TestTenantHelper tenantHelper;

    @LocalServerPort
    protected int port;

    @Autowired
    protected TestRestTemplate restTemplate;


    /**
     * 构建API基础URL
     */
    protected String baseUrl(String path) {
        return "http://localhost:" + port + "/api/v1" + path;
    }

    /**
     * 创建带认证的HTTP Headers
     */
    protected HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }

    /**
     * 创建不带认证的HTTP Headers
     */
    protected HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}

