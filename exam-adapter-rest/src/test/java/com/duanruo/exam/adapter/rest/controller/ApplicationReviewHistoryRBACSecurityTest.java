package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import com.duanruo.exam.application.dto.ApplicationResponse;
import com.duanruo.exam.application.service.ApplicationApplicationService;
import com.duanruo.exam.application.service.ApplicationAuditLogApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(ApplicationReviewHistoryRBACSecurityTest.MethodSecurityConfig.class)
class ApplicationReviewHistoryRBACSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig { }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationApplicationService appService;

    @MockBean
    private ApplicationAuditLogApplicationService auditService;

    @MockBean
    private com.duanruo.exam.application.service.ReviewApplicationService reviewService;
    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;


    @Test
    @WithMockUserWithPermissions(username = "11111111-1111-1111-1111-111111111111", role = "CANDIDATE")
    void candidate_can_access_own_reviews() throws Exception {
        UUID appId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID candidateId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        when(appService.getById(appId)).thenReturn(new ApplicationResponse(
                appId, UUID.randomUUID(), UUID.randomUUID(), candidateId, 1, "SUBMITTED", null));
        when(auditService.list(appId)).thenReturn(List.of());

        mockMvc.perform(get("/applications/" + appId + "/reviews").with(csrf()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUserWithPermissions(username = "22222222-2222-2222-2222-222222222222", role = "CANDIDATE")
    void candidate_cannot_access_others_reviews() throws Exception {
        UUID appId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID ownerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        when(appService.getById(appId)).thenReturn(new ApplicationResponse(
                appId, UUID.randomUUID(), UUID.randomUUID(), ownerId, 1, "SUBMITTED", null));

        mockMvc.perform(get("/applications/" + appId + "/reviews").with(csrf()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUserWithPermissions(username = "33333333-3333-3333-3333-333333333333", role = "PRIMARY_REVIEWER")
    void primary_reviewer_can_access_any_reviews() throws Exception {
        UUID appId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        when(auditService.list(appId)).thenReturn(List.of());
        mockMvc.perform(get("/applications/" + appId + "/reviews").with(csrf()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUserWithPermissions(username = "44444444-4444-4444-4444-444444444444", role = "SECONDARY_REVIEWER")
    void secondary_reviewer_can_access_any_reviews() throws Exception {
        UUID appId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        when(auditService.list(appId)).thenReturn(List.of());
        mockMvc.perform(get("/applications/" + appId + "/reviews").with(csrf()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUserWithPermissions(username = "55555555-5555-5555-5555-555555555555", role = "ADMIN")
    void admin_can_access_any_reviews() throws Exception {
        UUID appId = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        when(auditService.list(appId)).thenReturn(List.of());
        mockMvc.perform(get("/applications/" + appId + "/reviews").with(csrf()).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}

