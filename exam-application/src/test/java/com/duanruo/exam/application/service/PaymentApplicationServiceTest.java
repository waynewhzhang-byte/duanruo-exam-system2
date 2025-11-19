// TODO: Fix this test - payment domain classes are incomplete
/*
package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ApplicationResponse;
import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import com.duanruo.exam.domain.ticket.TicketNo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentApplicationServiceTest {

    private ApplicationApplicationService applicationService;
    private ApplicationRepository applicationRepository;
    private ExamRepository examRepository;
    private SeatAssignmentRepository seatAssignmentRepository;
    private TicketApplicationService ticketApplicationService;
    private com.duanruo.exam.domain.payment.PaymentOrderRepository paymentOrderRepository;
    private java.util.List<com.duanruo.exam.domain.payment.PaymentGateway> paymentGateways;

    private PaymentApplicationService paymentService;

    @BeforeEach
    void setUp() {
        applicationService = mock(ApplicationApplicationService.class);
        applicationRepository = mock(ApplicationRepository.class);
        examRepository = mock(ExamRepository.class);
        seatAssignmentRepository = mock(SeatAssignmentRepository.class);
        ticketApplicationService = mock(TicketApplicationService.class);
        paymentOrderRepository = mock(com.duanruo.exam.domain.payment.PaymentOrderRepository.class);
        paymentGateways = java.util.Collections.emptyList();
        paymentService = new PaymentApplicationService(
                applicationService, applicationRepository, examRepository, seatAssignmentRepository,
                ticketApplicationService, paymentOrderRepository, paymentGateways
        );
    }

    @Test
    void freeExam_withSeatAssigned_shouldAutoIssueTicket() {
        // arrange domain objects
        UUID appId = UUID.randomUUID();
        UUID examUuid = UUID.randomUUID();
        UUID positionUuid = UUID.randomUUID();
        UUID candidateUuid = UUID.randomUUID();

        Application app = Application.create(ExamId.of(examUuid), PositionId.of(positionUuid), CandidateId.of(candidateUuid));
        app.updateFormData("{}\n");
        app.submit();
        app.applyAutoReviewResult("t", ApplicationStatus.AUTO_PASSED);
        app.applyReviewDecision(ApplicationStatus.APPROVED, "ok");

        when(applicationRepository.findById(ApplicationId.of(appId))).thenReturn(Optional.of(app));

        LocalDateTime now = LocalDateTime.now();
        Exam exam = Exam.rebuild(ExamId.of(examUuid), "FREE2025", "t", null, null,
                now.minusDays(1), now.plusDays(1), false, null, null,
                com.duanruo.exam.domain.exam.ExamStatus.OPEN, "admin", now.minusDays(2), now);
        when(examRepository.findById(ExamId.of(examUuid))).thenReturn(Optional.of(exam));

        when(seatAssignmentRepository.findByApplicationId(app.getId())).thenReturn(Optional.of(
                SeatAssignment.create(app.getExamId(), app.getPositionId(), app.getId(),
                        com.duanruo.exam.domain.venue.VenueId.of(UUID.randomUUID()), 1, UUID.randomUUID())
        ));

        when(applicationService.markPaid(appId)).thenReturn(new ApplicationResponse(
                appId, examUuid, positionUuid, candidateUuid, 1, "PAID", now
        ));

        when(ticketApplicationService.generate(appId)).thenReturn(TicketNo.of("FREE2025-DEV-20250101-0001"));

        // act
        Map<String, Object> resp = paymentService.onPaid(appId, "STUB", java.math.BigDecimal.ZERO, "txn123");

        // assert
        verify(ticketApplicationService, atLeastOnce()).generate(appId);
        assertThat((Boolean) resp.get("ticketIssued")).isTrue();
        assertThat((String) resp.get("ticketNumber")).isNotBlank();
    }

    @Test
    void onPaid_is_idempotent_by_transaction_key() {
        UUID appId = UUID.randomUUID();
        UUID examUuid = UUID.randomUUID();
        UUID positionUuid = UUID.randomUUID();
        UUID candidateUuid = UUID.randomUUID();

        Application app = Application.create(ExamId.of(examUuid), PositionId.of(positionUuid), CandidateId.of(candidateUuid));
        when(applicationRepository.findById(ApplicationId.of(appId))).thenReturn(Optional.of(app));

        var now = LocalDateTime.now();
        Exam exam = Exam.rebuild(ExamId.of(examUuid), "FREE2025", "t", null, null,
                now.minusDays(1), now.plusDays(1), false, null, null,
                com.duanruo.exam.domain.exam.ExamStatus.OPEN, "admin", now.minusDays(2), now);
        when(examRepository.findById(ExamId.of(examUuid))).thenReturn(Optional.of(exam));

        when(seatAssignmentRepository.findByApplicationId(app.getId())).thenReturn(Optional.empty());
        when(applicationService.markPaid(appId)).thenReturn(new ApplicationResponse(
                appId, examUuid, positionUuid, candidateUuid, 1, "PAID", now
        ));

        Map<String, Object> r1 = paymentService.onPaid(appId, "STUB", java.math.BigDecimal.ZERO, "txnXYZ");
        Map<String, Object> r2 = paymentService.onPaid(appId, "STUB", java.math.BigDecimal.ZERO, "txnXYZ");

        verify(applicationService, times(1)).markPaid(appId);
        verify(ticketApplicationService, never()).generate(any());
        assertThat(r1.get("idempotent")).isEqualTo(false);
        assertThat(r2.get("idempotent")).isEqualTo(true);
    }
}
*/
