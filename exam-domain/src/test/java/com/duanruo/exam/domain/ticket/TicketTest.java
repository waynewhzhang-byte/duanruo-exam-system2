package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * 准考证聚合根单元测试
 */
class TicketTest {

    // ========== 创建准考证测试 ==========

    @Test
    void create_shouldCreateTicket_whenValidDataProvided() {
        // Given
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        CandidateId candidateId = CandidateId.of(UUID.randomUUID());
        TicketNo ticketNo = TicketNo.of("2025-EXAM-001-0001");
        String candidateName = "张三";
        String candidateIdNumber = "110101199001011234";
        String examTitle = "2025年公务员考试";
        String positionTitle = "软件工程师";

        // When
        Ticket ticket = Ticket.create(
                applicationId,
                examId,
                positionId,
                candidateId,
                ticketNo,
                candidateName,
                candidateIdNumber,
                examTitle,
                positionTitle
        );

        // Then
        assertThat(ticket).isNotNull();
        assertThat(ticket.getId()).isNotNull();
        assertThat(ticket.getApplicationId()).isEqualTo(applicationId);
        assertThat(ticket.getExamId()).isEqualTo(examId);
        assertThat(ticket.getPositionId()).isEqualTo(positionId);
        assertThat(ticket.getCandidateId()).isEqualTo(candidateId);
        assertThat(ticket.getTicketNo()).isEqualTo(ticketNo);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.ISSUED);
        assertThat(ticket.getCandidateName()).isEqualTo(candidateName);
        assertThat(ticket.getCandidateIdNumber()).isEqualTo(candidateIdNumber);
        assertThat(ticket.getExamTitle()).isEqualTo(examTitle);
        assertThat(ticket.getPositionTitle()).isEqualTo(positionTitle);
        assertThat(ticket.getQrCode()).isNotNull();
        assertThat(ticket.getBarcode()).isNotNull();
        assertThat(ticket.getIssuedAt()).isNotNull();
        assertThat(ticket.getCreatedAt()).isNotNull();
        assertThat(ticket.getUpdatedAt()).isNotNull();
        assertThat(ticket.isValid()).isTrue();
    }

    @Test
    void create_shouldGenerateQRCodeAndBarcode_whenCreatingTicket() {
        // Given
        TicketNo ticketNo = TicketNo.of("2025-EXAM-001-0001");

        // When
        Ticket ticket = createTicket(ticketNo);

        // Then
        assertThat(ticket.getQrCode()).isEqualTo(ticketNo.getValue());
        assertThat(ticket.getBarcode()).isEqualTo("2025EXAM0010001");
    }

    @Test
    void create_shouldThrowException_whenApplicationIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> Ticket.create(
                null,
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                CandidateId.of(UUID.randomUUID()),
                TicketNo.of("2025-EXAM-001-0001"),
                "张三",
                "110101199001011234",
                "考试标题",
                "岗位标题"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("applicationId不能为空");
    }

    @Test
    void create_shouldThrowException_whenExamIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> Ticket.create(
                ApplicationId.of(UUID.randomUUID()),
                null,
                PositionId.of(UUID.randomUUID()),
                CandidateId.of(UUID.randomUUID()),
                TicketNo.of("2025-EXAM-001-0001"),
                "张三",
                "110101199001011234",
                "考试标题",
                "岗位标题"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("examId不能为空");
    }

    @Test
    void create_shouldThrowException_whenPositionIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> Ticket.create(
                ApplicationId.of(UUID.randomUUID()),
                ExamId.of(UUID.randomUUID()),
                null,
                CandidateId.of(UUID.randomUUID()),
                TicketNo.of("2025-EXAM-001-0001"),
                "张三",
                "110101199001011234",
                "考试标题",
                "岗位标题"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positionId不能为空");
    }

    @Test
    void create_shouldThrowException_whenCandidateIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> Ticket.create(
                ApplicationId.of(UUID.randomUUID()),
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                null,
                TicketNo.of("2025-EXAM-001-0001"),
                "张三",
                "110101199001011234",
                "考试标题",
                "岗位标题"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("candidateId不能为空");
    }

    @Test
    void create_shouldThrowException_whenTicketNoIsNull() {
        // When & Then
        assertThatThrownBy(() -> Ticket.create(
                ApplicationId.of(UUID.randomUUID()),
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                CandidateId.of(UUID.randomUUID()),
                null,
                "张三",
                "110101199001011234",
                "考试标题",
                "岗位标题"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ticketNo不能为空");
    }

    // ========== 状态转换测试 ==========

    @Test
    void markAsPrinted_shouldMarkAsPrinted_whenTicketIsIssued() {
        // Given
        Ticket ticket = createTicket();

        // When
        ticket.markAsPrinted();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.PRINTED);
        assertThat(ticket.getPrintedAt()).isNotNull();
    }

    @Test
    void markAsVerified_shouldMarkAsVerified_whenTicketIsIssued() {
        // Given
        Ticket ticket = createTicket();

        // When
        ticket.markAsVerified();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.VERIFIED);
        assertThat(ticket.getVerifiedAt()).isNotNull();
    }

    @Test
    void markAsVerified_shouldMarkAsVerified_whenTicketIsPrinted() {
        // Given
        Ticket ticket = createTicket();
        ticket.markAsPrinted();

        // When
        ticket.markAsVerified();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.VERIFIED);
        assertThat(ticket.getVerifiedAt()).isNotNull();
    }

    @Test
    void cancel_shouldCancelTicket_whenTicketIsIssued() {
        // Given
        Ticket ticket = createTicket();

        // When
        ticket.cancel();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        assertThat(ticket.getCancelledAt()).isNotNull();
        assertThat(ticket.isValid()).isFalse();
    }

    @Test
    void cancel_shouldCancelTicket_whenTicketIsPrinted() {
        // Given
        Ticket ticket = createTicket();
        ticket.markAsPrinted();

        // When
        ticket.cancel();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        assertThat(ticket.getCancelledAt()).isNotNull();
    }

    @Test
    void cancel_shouldCancelTicket_whenTicketIsVerified() {
        // Given
        Ticket ticket = createTicket();
        ticket.markAsVerified();

        // When
        ticket.cancel();

        // Then
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CANCELLED);
        assertThat(ticket.getCancelledAt()).isNotNull();
    }

    @Test
    void markAsPrinted_shouldThrowException_whenTicketIsCancelled() {
        // Given
        Ticket ticket = createTicket();
        ticket.cancel();

        // When & Then
        assertThatThrownBy(() -> ticket.markAsPrinted())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("准考证状态不允许转换为已打印");
    }

    @Test
    void markAsVerified_shouldThrowException_whenTicketIsCancelled() {
        // Given
        Ticket ticket = createTicket();
        ticket.cancel();

        // When & Then
        assertThatThrownBy(() -> ticket.markAsVerified())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("准考证状态不允许转换为已验证");
    }

    @Test
    void cancel_shouldThrowException_whenTicketIsAlreadyCancelled() {
        // Given
        Ticket ticket = createTicket();
        ticket.cancel();

        // When & Then
        assertThatThrownBy(() -> ticket.cancel())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("准考证状态不允许转换为已取消");
    }

    // ========== 设置考场信息测试 ==========

    @Test
    void setVenueInfo_shouldSetVenueInfo_whenValidDataProvided() {
        // Given
        Ticket ticket = createTicket();
        String venueName = "北京市第一考场";
        String roomNumber = "101";
        String seatNumber = "15";

        // When
        ticket.setVenueInfo(venueName, roomNumber, seatNumber);

        // Then
        assertThat(ticket.getVenueName()).isEqualTo(venueName);
        assertThat(ticket.getRoomNumber()).isEqualTo(roomNumber);
        assertThat(ticket.getSeatNumber()).isEqualTo(seatNumber);
    }

    // ========== 设置考试时间测试 ==========

    @Test
    void setExamTime_shouldSetExamTime_whenValidDataProvided() {
        // Given
        Ticket ticket = createTicket();
        LocalDateTime startTime = LocalDateTime.of(2025, 6, 15, 9, 0);
        LocalDateTime endTime = LocalDateTime.of(2025, 6, 15, 11, 0);

        // When
        ticket.setExamTime(startTime, endTime);

        // Then
        assertThat(ticket.getExamStartTime()).isEqualTo(startTime);
        assertThat(ticket.getExamEndTime()).isEqualTo(endTime);
    }

    // ========== 设置考生照片测试 ==========

    @Test
    void setCandidatePhoto_shouldSetPhoto_whenValidUrlProvided() {
        // Given
        Ticket ticket = createTicket();
        String photoUrl = "https://example.com/photos/candidate123.jpg";

        // When
        ticket.setCandidatePhoto(photoUrl);

        // Then
        assertThat(ticket.getCandidatePhoto()).isEqualTo(photoUrl);
    }

    // ========== 辅助方法 ==========

    private Ticket createTicket() {
        return createTicket(TicketNo.of("2025-EXAM-001-0001"));
    }

    private Ticket createTicket(TicketNo ticketNo) {
        return Ticket.create(
                ApplicationId.of(UUID.randomUUID()),
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                CandidateId.of(UUID.randomUUID()),
                ticketNo,
                "张三",
                "110101199001011234",
                "2025年公务员考试",
                "软件工程师"
        );
    }
}

