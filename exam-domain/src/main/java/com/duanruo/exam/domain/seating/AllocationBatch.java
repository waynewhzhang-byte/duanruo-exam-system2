package com.duanruo.exam.domain.seating;

import com.duanruo.exam.domain.exam.ExamId;

import java.time.LocalDateTime;
import java.util.UUID;

public class AllocationBatch {
    private UUID id;
    private ExamId examId;
    private String strategy; // description/json
    private int totalCandidates;
    private int totalAssigned;
    private int totalVenues;
    private LocalDateTime createdAt;
    private String createdBy;

    private AllocationBatch() {}

    public static AllocationBatch create(ExamId examId, String strategy, String createdBy) {
        AllocationBatch b = new AllocationBatch();
        b.id = UUID.randomUUID();
        b.examId = examId;
        b.strategy = strategy;
        b.createdAt = LocalDateTime.now();
        b.createdBy = createdBy;
        return b;
    }

    public UUID getId() { return id; }
    public ExamId getExamId() { return examId; }
    public String getStrategy() { return strategy; }
    public int getTotalCandidates() { return totalCandidates; }
    public int getTotalAssigned() { return totalAssigned; }
    public int getTotalVenues() { return totalVenues; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }

    public void setTotals(int totalCandidates, int totalAssigned, int totalVenues) {
        this.totalCandidates = totalCandidates;
        this.totalAssigned = totalAssigned;
        this.totalVenues = totalVenues;
    }
}

