package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "allocation_batches", indexes = {
        @Index(name = "idx_alloc_batch_exam", columnList = "exam_id"),
        @Index(name = "idx_alloc_batch_created", columnList = "created_at")
})
public class AllocationBatchEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "strategy", columnDefinition = "TEXT")
    private String strategy;

    @Column(name = "total_candidates")
    private int totalCandidates;

    @Column(name = "total_assigned")
    private int totalAssigned;

    @Column(name = "total_venues")
    private int totalVenues;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private String createdBy;

    protected AllocationBatchEntity() {}

    public AllocationBatchEntity(UUID id, UUID examId, String strategy, String createdBy) {
        this.id = id; this.examId = examId; this.strategy = strategy; this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
    }

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public String getStrategy() { return strategy; }
    public void setStrategy(String strategy) { this.strategy = strategy; }
    public int getTotalCandidates() { return totalCandidates; }
    public void setTotalCandidates(int totalCandidates) { this.totalCandidates = totalCandidates; }
    public int getTotalAssigned() { return totalAssigned; }
    public void setTotalAssigned(int totalAssigned) { this.totalAssigned = totalAssigned; }
    public int getTotalVenues() { return totalVenues; }
    public void setTotalVenues(int totalVenues) { this.totalVenues = totalVenues; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

