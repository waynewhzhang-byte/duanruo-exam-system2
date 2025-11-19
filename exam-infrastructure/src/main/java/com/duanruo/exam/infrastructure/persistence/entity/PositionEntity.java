package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 岗位JPA实体
 */
@Entity
@Table(name = "positions", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "code"}))
public class PositionEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "exam_id", nullable = false)
    private UUID examId;
    
    @Column(name = "code", nullable = false, length = 64)
    private String code;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
    
    @Column(name = "quota")
    private Integer quota;

    @Transient
    private UUID seatRuleId;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", insertable = false, updatable = false)
    private ExamEntity exam;
    
    @OneToMany(mappedBy = "position", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SubjectEntity> subjects = new ArrayList<>();
    
    // Constructors
    public PositionEntity() {}
    
    public PositionEntity(UUID id, UUID examId, String code, String title) {
        this.id = id;
        this.examId = examId;
        this.code = code;
        this.title = title;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    
    public Integer getQuota() { return quota; }
    public void setQuota(Integer quota) { this.quota = quota; }
    
    public UUID getSeatRuleId() { return seatRuleId; }
    public void setSeatRuleId(UUID seatRuleId) { this.seatRuleId = seatRuleId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    
    public List<SubjectEntity> getSubjects() { return subjects; }
    public void setSubjects(List<SubjectEntity> subjects) { this.subjects = subjects; }
}
