package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_reviewers",
        uniqueConstraints = @UniqueConstraint(name = "uk_exam_reviewer_stage", columnNames = {"exam_id", "reviewer_id", "stage"}),
        indexes = {
                @Index(name = "idx_exam_reviewers_exam", columnList = "exam_id"),
                @Index(name = "idx_exam_reviewers_reviewer", columnList = "reviewer_id")
        })
public class ExamReviewerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "reviewer_id", nullable = false)
    private UUID reviewerId;

    public enum StageEntity { PRIMARY, SECONDARY }

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 32)
    private StageEntity stage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected ExamReviewerEntity() {}

    public ExamReviewerEntity(UUID examId, UUID reviewerId, StageEntity stage) {
        this.examId = examId;
        this.reviewerId = reviewerId;
        this.stage = stage;
    }

    public Long getId() { return id; }
    public UUID getExamId() { return examId; }
    public UUID getReviewerId() { return reviewerId; }
    public StageEntity getStage() { return stage; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

