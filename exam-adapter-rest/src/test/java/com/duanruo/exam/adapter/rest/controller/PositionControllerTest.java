package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.application.service.PositionApplicationService;
import com.duanruo.exam.domain.exam.SubjectType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import com.duanruo.exam.adapter.rest.security.WithMockUserWithPermissions;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PositionController.class)
class PositionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PositionApplicationService positionService;

    @MockBean
    private com.duanruo.exam.application.service.JwtTokenService jwtTokenService;

    @Test
    @WithMockUserWithPermissions(role = "ADMIN")
    void createPosition_shouldReturn201() throws Exception {
        var pos = PositionResponse.builder()
                .id(UUID.randomUUID().toString())
                .examId(UUID.randomUUID().toString())
                .code("DEV001").title("开发")
                .description("desc").requirements("req").quota(5)
                .build();
        given(positionService.createPosition(any(), anyString(), anyString(), any(), any(), any()))
                .willReturn(pos);

        String body = "{" +
                "\"examId\":\"" + UUID.randomUUID() + "\"," +
                "\"code\":\"DEV001\"," +
                "\"title\":\"开发\"," +
                "\"description\":\"desc\"," +
                "\"requirements\":\"req\"," +
                "\"quota\":5" +
                "}";

        mockMvc.perform(post("/positions")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is("DEV001")))
                .andExpect(jsonPath("$.title", is("开发")));
    }

    @Test
    @WithMockUserWithPermissions(role = "ADMIN")
    void createSubject_shouldReturn201() throws Exception {
        var positionId = UUID.randomUUID();
        var subjectId = UUID.randomUUID();
        var domainSubject = com.duanruo.exam.domain.exam.Subject.rebuild(
                com.duanruo.exam.domain.exam.SubjectId.of(subjectId),
                com.duanruo.exam.domain.exam.PositionId.of(positionId),
                "专业笔试",
                120,
                SubjectType.WRITTEN,
                new BigDecimal("100"),
                new BigDecimal("60"),
                new BigDecimal("0.7"),
                1,
                "2025-10-01 09:00"
        );

        given(positionService.createSubject(any(UUID.class), anyString(), anyInt(), any(SubjectType.class),
                any(), any(), any(), any(), any()))
                .willReturn(domainSubject);

        String body = "{" +
                "\"name\":\"专业笔试\"," +
                "\"duration\":120," +
                "\"type\":\"WRITTEN\"," +
                "\"maxScore\":100," +
                "\"passingScore\":60," +
                "\"weight\":0.7," +
                "\"ordering\":1," +
                "\"schedule\":\"2025-10-01 09:00\"" +
                "}";

        mockMvc.perform(post("/positions/" + UUID.randomUUID() + "/subjects")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

}

