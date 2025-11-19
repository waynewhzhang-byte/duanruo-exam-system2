package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.ApplicationAuditLogItemResponse;
import com.duanruo.exam.application.service.ApplicationAuditLogApplicationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import com.duanruo.exam.application.service.ApplicationApplicationService;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationAuditLogsEndpointTest {


    @MockBean
    private ApplicationApplicationService appService;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationAuditLogApplicationService auditService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;
    @MockBean
    private com.duanruo.exam.application.service.ReviewApplicationService reviewService;


    @Test
    @WithMockUser(roles = {"ADMIN"})
    void listAuditLogsShouldReturnItems() throws Exception {
        UUID appId = UUID.randomUUID();
        var item = new ApplicationAuditLogItemResponse(
                UUID.randomUUID(),
                appId,
                "SUBMITTED",
                "APPROVED",
                "SYSTEM",
                "auto-review",
                null,
                LocalDateTime.now()
        );
        Mockito.when(auditService.list(appId)).thenReturn(List.of(item));

        mockMvc.perform(get("/applications/" + appId + "/audit-logs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].applicationId").value(appId.toString()))
                .andExpect(jsonPath("$[0].fromStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$[0].toStatus").value("APPROVED"));
    }
}

