package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ApplicationSubmitRequest;
import com.duanruo.exam.application.port.ApplicationFileAttachmentPort;
import com.duanruo.exam.application.port.NotificationPort;
import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Verifies that application/ticket services trigger NotificationPort on key transitions.
 */
class NotificationHooksTest {

    private ApplicationRepository applicationRepository;
    private ApplicationAuditLogRepository auditLogRepository;
    private ApplicationFileAttachmentPort fileAttachmentPort;
    private NotificationPort notificationPort;

    private com.duanruo.exam.domain.exam.ExamRepository examRepository;

    @BeforeEach
    void setUp() {
        applicationRepository = mock(ApplicationRepository.class);
        auditLogRepository = mock(ApplicationAuditLogRepository.class);
        fileAttachmentPort = mock(ApplicationFileAttachmentPort.class);
        notificationPort = mock(NotificationPort.class);
        examRepository = mock(com.duanruo.exam.domain.exam.ExamRepository.class);
    }

    @Test
    void submit_shouldSendSubmittedAndAutoReviewNotifications() {
        ApplicationApplicationService svc = new ApplicationApplicationService(
                applicationRepository, auditLogRepository, fileAttachmentPort, notificationPort, examRepository);

        UUID candidateId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();

        // stub exam open within registration window
        var now = java.time.LocalDateTime.now();
        when(examRepository.findById(ExamId.of(examId))).thenReturn(java.util.Optional.of(
                com.duanruo.exam.domain.exam.Exam.rebuild(ExamId.of(examId), "EX2025", "t", null, null,
                        now.minusDays(1), now.plusDays(1), false, null, null,
                        com.duanruo.exam.domain.exam.ExamStatus.OPEN, "u", now.minusDays(2), now)
        ));

        ApplicationSubmitRequest req = new ApplicationSubmitRequest(
                examId,
                positionId,
                Integer.valueOf(1),
                Map.of("education", (Object)"本科"),
                List.of()
        );

        svc.submit(candidateId, req);

        // verify notifications
        verify(notificationPort, atLeastOnce()).sendToUser(eq(candidateId), eq("APPLICATION_SUBMITTED"), anyMap());
        verify(notificationPort, atLeastOnce()).sendToUser(eq(candidateId), startsWith("AUTO_REVIEW_"), anyMap());
    }

    @Test
    void markPaid_shouldSendPaidNotification() {
        // prepare domain object
        UUID appId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        Application app = Application.create(ExamId.of(examId), PositionId.of(positionId), CandidateId.of(candidateId));
        app.updateFormData("{\"name\":\"A\"}");
        app.submit();
        app.applyAutoReviewResult("test", ApplicationStatus.AUTO_PASSED);
        app.applyReviewDecision(ApplicationStatus.APPROVED, "ok");
        when(applicationRepository.findById(ApplicationId.of(appId))).thenReturn(Optional.of(app));

        ApplicationApplicationService svc = new ApplicationApplicationService(
                applicationRepository, auditLogRepository, fileAttachmentPort, notificationPort, examRepository);

        svc.markPaid(appId);

        verify(notificationPort, atLeastOnce()).sendToUser(eq(candidateId), eq("APPLICATION_PAID"), anyMap());
    }

    @Test
    void ticketGenerate_shouldSendTicketIssuedNotification() {
        // prepare
        UUID appId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        Application app = Application.create(ExamId.of(examId), PositionId.of(positionId), CandidateId.of(candidateId));
        app.updateFormData("{\"name\":\"A\"}");
        app.submit();
        app.applyAutoReviewResult("test", ApplicationStatus.AUTO_PASSED);
        app.applyReviewDecision(ApplicationStatus.APPROVED, "ok");
        app.markAsPaid();
        when(applicationRepository.findById(ApplicationId.of(appId))).thenReturn(Optional.of(app));

        // deps for new TicketApplicationService
        var examRepository = mock(com.duanruo.exam.domain.exam.ExamRepository.class);
        var positionRepository = mock(com.duanruo.exam.domain.exam.PositionRepository.class);
        var ruleService = mock(TicketNumberRuleApplicationService.class);
        var ticketRepository = mock(com.duanruo.exam.domain.ticket.TicketRepository.class);
        when(examRepository.findById(app.getExamId())).thenReturn(Optional.of(
                com.duanruo.exam.domain.exam.Exam.rebuild(app.getExamId(), "EXAM2024", "t", null, null, null, null, false, null, null, com.duanruo.exam.domain.exam.ExamStatus.OPEN, "u", java.time.LocalDateTime.now(), java.time.LocalDateTime.now())
        ));
        when(positionRepository.findById(app.getPositionId())).thenReturn(Optional.of(
                com.duanruo.exam.domain.exam.Position.rebuild(app.getPositionId(), app.getExamId(), "DEV001", "t", null, null, null, null)
        ));
        when(ruleService.generateNumber(any(), any(), any(), any())).thenReturn("EXAM2024-DEV001-20250101-0001");

        TicketApplicationService ticketSvc = new TicketApplicationService(
                applicationRepository, auditLogRepository, notificationPort, examRepository, positionRepository, ruleService, ticketRepository);

        ticketSvc.generate(appId);

        verify(notificationPort, atLeastOnce()).sendToUser(eq(candidateId), eq("TICKET_ISSUED"), anyMap());
    }
}

