package com.duanruo.exam.domain.seating;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.venue.VenueId;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * 座位分配领域对象单元测试
 */
class SeatAssignmentTest {

    // ========== 创建座位分配测试 ==========

    @Test
    void create_shouldCreateSeatAssignment_whenValidDataProvided() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        int seatNo = 15;
        UUID batchId = UUID.randomUUID();

        // When
        SeatAssignment assignment = SeatAssignment.create(
                examId,
                positionId,
                applicationId,
                venueId,
                seatNo,
                batchId
        );

        // Then
        assertThat(assignment).isNotNull();
        assertThat(assignment.getId()).isNotNull();
        assertThat(assignment.getExamId()).isEqualTo(examId);
        assertThat(assignment.getPositionId()).isEqualTo(positionId);
        assertThat(assignment.getApplicationId()).isEqualTo(applicationId);
        assertThat(assignment.getVenueId()).isEqualTo(venueId);
        assertThat(assignment.getSeatNo()).isEqualTo(seatNo);
        assertThat(assignment.getBatchId()).isEqualTo(batchId);
        assertThat(assignment.getCreatedAt()).isNotNull();
    }

    @Test
    void create_shouldGenerateUniqueId_whenCreatingMultipleAssignments() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId1 = ApplicationId.of(UUID.randomUUID());
        ApplicationId applicationId2 = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        // When
        SeatAssignment assignment1 = SeatAssignment.create(
                examId, positionId, applicationId1, venueId, 1, batchId
        );
        SeatAssignment assignment2 = SeatAssignment.create(
                examId, positionId, applicationId2, venueId, 2, batchId
        );

        // Then
        assertThat(assignment1.getId()).isNotEqualTo(assignment2.getId());
    }

    @Test
    void create_shouldAllowSameSeatNoInDifferentVenues() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId1 = ApplicationId.of(UUID.randomUUID());
        ApplicationId applicationId2 = ApplicationId.of(UUID.randomUUID());
        VenueId venueId1 = VenueId.of(UUID.randomUUID());
        VenueId venueId2 = VenueId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();
        int seatNo = 10;

        // When
        SeatAssignment assignment1 = SeatAssignment.create(
                examId, positionId, applicationId1, venueId1, seatNo, batchId
        );
        SeatAssignment assignment2 = SeatAssignment.create(
                examId, positionId, applicationId2, venueId2, seatNo, batchId
        );

        // Then
        assertThat(assignment1.getSeatNo()).isEqualTo(seatNo);
        assertThat(assignment2.getSeatNo()).isEqualTo(seatNo);
        assertThat(assignment1.getVenueId()).isNotEqualTo(assignment2.getVenueId());
    }

    @Test
    void create_shouldAllowSeatNo1() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        // When
        SeatAssignment assignment = SeatAssignment.create(
                examId, positionId, applicationId, venueId, 1, batchId
        );

        // Then
        assertThat(assignment.getSeatNo()).isEqualTo(1);
    }

    @Test
    void create_shouldAllowLargeSeatNo() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        // When
        SeatAssignment assignment = SeatAssignment.create(
                examId, positionId, applicationId, venueId, 999, batchId
        );

        // Then
        assertThat(assignment.getSeatNo()).isEqualTo(999);
    }

    // ========== 批次管理测试 ==========

    @Test
    void create_shouldAssignSameBatchId_whenCreatedInSameBatch() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId1 = ApplicationId.of(UUID.randomUUID());
        ApplicationId applicationId2 = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        // When
        SeatAssignment assignment1 = SeatAssignment.create(
                examId, positionId, applicationId1, venueId, 1, batchId
        );
        SeatAssignment assignment2 = SeatAssignment.create(
                examId, positionId, applicationId2, venueId, 2, batchId
        );

        // Then
        assertThat(assignment1.getBatchId()).isEqualTo(batchId);
        assertThat(assignment2.getBatchId()).isEqualTo(batchId);
        assertThat(assignment1.getBatchId()).isEqualTo(assignment2.getBatchId());
    }

    @Test
    void create_shouldAllowDifferentBatchIds() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        ApplicationId applicationId1 = ApplicationId.of(UUID.randomUUID());
        ApplicationId applicationId2 = ApplicationId.of(UUID.randomUUID());
        VenueId venueId = VenueId.of(UUID.randomUUID());
        UUID batchId1 = UUID.randomUUID();
        UUID batchId2 = UUID.randomUUID();

        // When
        SeatAssignment assignment1 = SeatAssignment.create(
                examId, positionId, applicationId1, venueId, 1, batchId1
        );
        SeatAssignment assignment2 = SeatAssignment.create(
                examId, positionId, applicationId2, venueId, 2, batchId2
        );

        // Then
        assertThat(assignment1.getBatchId()).isNotEqualTo(assignment2.getBatchId());
    }

    // ========== 相等性测试 ==========

    @Test
    void equals_shouldReturnTrue_whenSameId() {
        // Given
        SeatAssignment assignment1 = createSeatAssignment();
        SeatAssignment assignment2 = assignment1;

        // When & Then
        assertThat(assignment1).isEqualTo(assignment2);
    }

    @Test
    void equals_shouldReturnFalse_whenDifferentId() {
        // Given
        SeatAssignment assignment1 = createSeatAssignment();
        SeatAssignment assignment2 = createSeatAssignment();

        // When & Then
        assertThat(assignment1).isNotEqualTo(assignment2);
    }

    @Test
    void hashCode_shouldBeSame_whenSameObject() {
        // Given
        SeatAssignment assignment = createSeatAssignment();

        // When & Then
        assertThat(assignment.hashCode()).isEqualTo(assignment.hashCode());
    }

    @Test
    void hashCode_shouldBeDifferent_whenDifferentObjects() {
        // Given
        SeatAssignment assignment1 = createSeatAssignment();
        SeatAssignment assignment2 = createSeatAssignment();

        // When & Then
        assertThat(assignment1.hashCode()).isNotEqualTo(assignment2.hashCode());
    }

    // ========== 辅助方法 ==========

    private SeatAssignment createSeatAssignment() {
        return SeatAssignment.create(
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                ApplicationId.of(UUID.randomUUID()),
                VenueId.of(UUID.randomUUID()),
                10,
                UUID.randomUUID()
        );
    }
}

