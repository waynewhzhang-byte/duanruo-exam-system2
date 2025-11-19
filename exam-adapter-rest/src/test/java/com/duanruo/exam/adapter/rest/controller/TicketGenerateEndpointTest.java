package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.TicketApplicationService;
import com.duanruo.exam.domain.ticket.TicketNo;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TicketController.class)
@AutoConfigureMockMvc(addFilters = false)
class TicketGenerateEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TicketApplicationService ticketApplicationService;

    @MockBean
    private com.duanruo.exam.application.service.TicketNumberRuleApplicationService ruleService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;


    @Test
    @WithMockUserWithPermissions(role = "ADMIN")
    void generateTicketShouldReturnIssuedStatus() throws Exception {
        UUID appId = UUID.randomUUID();
        Mockito.when(ticketApplicationService.generate(appId))
                .thenReturn(TicketNo.of("T-" + appId.toString().substring(0,8) + "-123456"));

        mockMvc.perform(post("/tickets/application/" + appId + "/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationId").value(appId.toString()))
                .andExpect(jsonPath("$.ticketNumber").exists())
                .andExpect(jsonPath("$.status").value("ISSUED"));
    }
}

