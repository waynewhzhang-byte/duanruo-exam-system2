package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.ApplicationResponse;
import com.duanruo.exam.application.service.ApplicationApplicationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationRunAutoReviewEndpointTest {

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
    void runAutoReviewShouldReturnMappedResult() throws Exception {
        UUID appId = UUID.randomUUID();
        ApplicationResponse resp = new ApplicationResponse(
                appId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, "AUTO_PASSED", null
        );
        Mockito.when(appService.runAutoReview(appId)).thenReturn(resp);

        mockMvc.perform(post("/applications/" + appId + "/run-auto-review")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appId.toString()))
                .andExpect(jsonPath("$.autoReviewResult").value("AutoPassed"))
                .andExpect(jsonPath("$.reason").value("所有自动审核规则通过"));
    }
}

