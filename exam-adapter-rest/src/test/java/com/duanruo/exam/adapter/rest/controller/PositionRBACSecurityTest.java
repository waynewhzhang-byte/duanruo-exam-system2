package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.service.PositionApplicationService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PositionController.class)
@AutoConfigureMockMvc(addFilters = false)
class PositionRBACSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig { }


    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PositionApplicationService positionService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;

    @Test
    @WithMockUser(roles = {"CANDIDATE"})
    void createPosition_should_forbid_non_admin() throws Exception {
        String body = "{\n  \"examId\": \"00000000-0000-0000-0000-000000000001\",\n  \"code\": \"DEV001\",\n  \"title\": \"Dev\",\n  \"description\": \"d\",\n  \"requirements\": \"r\",\n  \"quota\": 1\n}";
        mockMvc.perform(post("/positions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }
}

