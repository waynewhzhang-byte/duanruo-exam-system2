package com.duanruo.exam.bootstrap.e2e;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.application.service.AuthenticationService;
import com.duanruo.exam.application.service.ExamApplicationService;
import com.duanruo.exam.application.service.PositionApplicationService;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class E2EFlowPostgresIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("exam_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
    }

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate rest;

    @Autowired
    AuthenticationService authenticationService;

    @Autowired
    ExamApplicationService examService;

    @Autowired
    PositionApplicationService positionService;

    private String base(String path) {
        return "http://localhost:" + port + "/api/v1" + path;
    }

    @Test
    void full_flow_submit_to_ticket_with_audit_logs() {
        // 1) Create an admin user directly via service and login to get token
        RegisterRequest adminReq = new RegisterRequest();
        adminReq.setUsername("admin_it");
        adminReq.setPassword("Password1!");
        adminReq.setConfirmPassword("Password1!");
        adminReq.setEmail("admin_it@example.com");
        adminReq.setFullName("Admin IT");
        authenticationService.createSystemUser(adminReq, Set.of(Role.ADMIN));
        String adminToken = loginAndGetToken("admin_it", "Password1!");

        // 2) Create an exam and open it (service setup)
        ExamCreateRequest examCreate = new ExamCreateRequest();
        examCreate.setCode("DEV2025");
        examCreate.setTitle("2025开发岗考试");
        examCreate.setDescription("E2E IT");
        examCreate.setRegistrationStart(LocalDateTime.now().minusDays(1));
        examCreate.setRegistrationEnd(LocalDateTime.now().plusDays(10));
        examCreate.setFeeRequired(Boolean.FALSE);
        ExamResponse exam = examService.createExam(examCreate, "admin_it");
        examService.openExam(ExamId.of(UUID.fromString(exam.getId())));

        // 3) Create a position under the exam (service setup)
        var pos = positionService.createPosition(UUID.fromString(exam.getId()), "DEV001", "软件开发工程师", "", "", 100);

        // 4) Register a candidate via REST and login
        Map<String, Object> regBody = Map.of(
                "username", "cand_it",
                "password", "Password1!",
                "confirmPassword", "Password1!",
                "email", "cand_it@example.com",
                "fullName", "候选人一"
        );
        ResponseEntity<UserResponse> regResp = rest.postForEntity(base("/auth/register"), regBody, UserResponse.class);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String candidateId = regResp.getBody().getId();
        String candToken = loginAndGetToken("cand_it", "Password1!");

        // 5) Candidate submits an application via REST
        Map<String, Object> submitBody = new HashMap<>();
        submitBody.put("examId", exam.getId());
        submitBody.put("positionId", pos.getId());
        submitBody.put("formVersion", 1);
        submitBody.put("payload", Map.of("age", 25, "degree", "本科"));
        HttpHeaders candHeaders = new HttpHeaders();
        candHeaders.setBearerAuth(candToken);
        candHeaders.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<ApplicationResponse> submitResp = rest.exchange(
                base("/applications"), HttpMethod.POST, new HttpEntity<>(submitBody, candHeaders), ApplicationResponse.class);
        assertThat(submitResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID appId = submitResp.getBody().id();

        // 6) Admin triggers auto-review via REST
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setBearerAuth(adminToken);
        adminHeaders.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> autoReviewResp = rest.exchange(
                base("/applications/" + appId + "/run-auto-review"), HttpMethod.POST, new HttpEntity<>(Map.of(), adminHeaders), Map.class);
        assertThat(autoReviewResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 7) Candidate pays via REST (stubbed)
        ResponseEntity<Map> payResp = rest.exchange(
                base("/applications/" + appId + "/pay"), HttpMethod.POST, new HttpEntity<>(Map.of("channel", "STUB"), candHeaders), Map.class);
        assertThat(payResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((String) payResp.getBody().get("status")).isIn("PAID", "TicketIssued", "TICKET_ISSUED");

        // 8) Admin closes exam, configures venue, allocates seats (post-registration)
        ResponseEntity<Map> closeResp = rest.exchange(
                base("/exams/" + exam.getId() + "/close"), HttpMethod.POST, new HttpEntity<>(Map.of(), adminHeaders), Map.class);
        assertThat(closeResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> venueBody = Map.of("name", "Hall A", "capacity", 100);
        ResponseEntity<Map> venueResp = rest.exchange(
                base("/exams/" + exam.getId() + "/venues"), HttpMethod.POST, new HttpEntity<>(venueBody, adminHeaders), Map.class);
        assertThat(venueResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map> allocResp = rest.exchange(
                base("/exams/" + exam.getId() + "/allocate-seats"), HttpMethod.POST, new HttpEntity<>(Map.of(), adminHeaders), Map.class);
        assertThat(allocResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Number)allocResp.getBody().get("totalAssigned")).intValue()).isGreaterThanOrEqualTo(1);

        // 9) Admin generates ticket via REST (now seat assigned)
        ResponseEntity<Map> ticketResp = rest.exchange(
                base("/tickets/application/" + appId + "/generate"), HttpMethod.POST, new HttpEntity<>(Map.of(), adminHeaders), Map.class);
        assertThat(ticketResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(ticketResp.getBody().get("ticketNumber")).isNotNull();

        // 9) Fetch audit logs and assert key transitions are present
        ResponseEntity<ApplicationAuditLogItemResponse[]> logsResp = rest.exchange(
                base("/applications/" + appId + "/audit-logs"), HttpMethod.GET, new HttpEntity<>(candHeaders), ApplicationAuditLogItemResponse[].class);
        assertThat(logsResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        var logs = Arrays.asList(Objects.requireNonNull(logsResp.getBody()));
        var statuses = logs.stream().map(ApplicationAuditLogItemResponse::toStatus).toList();
        assertThat(statuses).anyMatch(s -> s.equals("SUBMITTED") || s.equals("AUTO_PASSED") || s.equals("AUTO_REJECTED"));
        assertThat(statuses).anyMatch(s -> s.equals("PAID") || s.equals("TICKET_ISSUED"));

        // 10) Candidate downloads ticket PDF
        String ticketId = (String) ticketResp.getBody().get("ticketId");
        ResponseEntity<byte[]> pdfResp = rest.exchange(
                base("/tickets/" + ticketId + "/download"), HttpMethod.GET, new HttpEntity<>(candHeaders), byte[].class);
        assertThat(pdfResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pdfResp.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(Objects.requireNonNull(pdfResp.getBody()).length).isGreaterThan(0);
    }

    private String loginAndGetToken(String username, String password) {
        Map<String, Object> body = Map.of(
                "username", username,
                "password", password
        );
        ResponseEntity<LoginResponse> resp = rest.postForEntity(base("/auth/login"), body, LoginResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody()).isNotNull();
        return resp.getBody().getToken();
    }
}

