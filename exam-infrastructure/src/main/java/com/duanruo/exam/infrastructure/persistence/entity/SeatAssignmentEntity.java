package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "seat_assignments", indexes = {
        @Index(name = "idx_seat_assign_exam", columnList = "exam_id"),
        @Index(name = "idx_seat_assign_batch", columnList = "batch_id"),
        @Index(name = "idx_seat_assign_position", columnList = "position_id"),
        @Index(name = "idx_seat_assign_venue", columnList = "venue_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_seat_assign_application", columnNames = {"application_id"})
})
public class SeatAssignmentEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "position_id", nullable = false)
    private UUID positionId;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "venue_id", nullable = false)
    private UUID venueId;

    @Column(name = "seat_no", nullable = false)
    private int seatNo;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected SeatAssignmentEntity() {}

    public SeatAssignmentEntity(UUID id, UUID examId, UUID positionId, UUID applicationId, UUID venueId, int seatNo, UUID batchId) {
        this.id = id; this.examId = examId; this.positionId = positionId; this.applicationId = applicationId;
        this.venueId = venueId; this.seatNo = seatNo; this.batchId = batchId; this.createdAt = LocalDateTime.now();
    }

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public UUID getVenueId() { return venueId; }
    public void setVenueId(UUID venueId) { this.venueId = venueId; }
    public int getSeatNo() { return seatNo; }
    public void setSeatNo(int seatNo) { this.seatNo = seatNo; }
    public UUID getBatchId() { return batchId; }
    public void setBatchId(UUID batchId) { this.batchId = batchId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

