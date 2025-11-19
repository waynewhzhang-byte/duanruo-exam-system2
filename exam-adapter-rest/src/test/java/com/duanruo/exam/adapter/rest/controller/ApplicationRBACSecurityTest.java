package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.ApplicationApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(controllers = ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationRBACSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig { }


    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationApplicationService appService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;

    @MockBean
    private com.duanruo.exam.application.service.ApplicationAuditLogApplicationService auditService;
    @MockBean
    private com.duanruo.exam.application.service.ReviewApplicationService reviewService;


    @Test
    @WithMockUser(roles = {"ADMIN"})
    void pay_should_forbid_non_candidate() throws Exception {
        UUID appId = UUID.randomUUID();
        when(appService.markPaid(appId)).thenReturn(new com.duanruo.exam.application.dto.ApplicationResponse(
                appId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, "PAID", java.time.LocalDateTime.now()
        ));
        mockMvc.perform(post("/applications/" + appId + "/pay")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"CANDIDATE"})
    void runAutoReview_should_forbid_non_admin() throws Exception {
        UUID appId = UUID.randomUUID();
        when(appService.runAutoReview(appId)).thenReturn(new com.duanruo.exam.application.dto.ApplicationResponse(
                appId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, "AUTO_PASSED", java.time.LocalDateTime.now()
        ));
        mockMvc.perform(post("/applications/" + appId + "/run-auto-review")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}

