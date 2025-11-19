package com.duanruo.exam.adapter.rest.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(controllers = TicketController.class)
@AutoConfigureMockMvc(addFilters = false)
class TicketRBACSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig { }


    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private com.duanruo.exam.application.service.TicketApplicationService ticketService;

    @MockBean
    private com.duanruo.exam.application.service.TicketNumberRuleApplicationService ruleService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;

    @Test
    @WithMockUserWithPermissions(role = "CANDIDATE")
    void generateTicket_should_forbid_non_admin() throws Exception {
        UUID appId = UUID.randomUUID();
        when(ticketService.generate(appId)).thenReturn(com.duanruo.exam.domain.ticket.TicketNo.of("EXAM2024-DEV001-000001"));
        mockMvc.perform(post("/tickets/application/" + appId + "/generate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUserWithPermissions(role = "ADMIN")
    void generateTicket_should_allow_admin() throws Exception {
        UUID appId = UUID.randomUUID();
        when(ticketService.generate(appId)).thenReturn(com.duanruo.exam.domain.ticket.TicketNo.of("EXAM2024-DEV001-000002"));
        mockMvc.perform(post("/tickets/application/" + appId + "/generate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated());
    }
}

