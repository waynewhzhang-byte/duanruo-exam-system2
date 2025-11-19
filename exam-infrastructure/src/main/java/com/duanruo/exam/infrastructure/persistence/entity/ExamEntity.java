package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * 考试JPA实体
 */
@Entity
@Table(name = "exams")
public class ExamEntity {

    @Id
    private UUID id;

    @Column(name = "code", unique = true, nullable = false, length = 64)
    private String code;

    @Transient
    private String slug;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "announcement", columnDefinition = "TEXT")
    private String announcement;

    @Column(name = "registration_start")
    private LocalDateTime registrationStart;

    @Column(name = "registration_end")
    private LocalDateTime registrationEnd;

    @Column(name = "exam_start")
    private LocalDateTime examStart;

    @Column(name = "exam_end")
    private LocalDateTime examEnd;

    @Column(name = "fee_required")
    private Boolean feeRequired = false;

    @Column(name = "fee_amount", precision = 10, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "ticket_template")
    private String ticketTemplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_template", columnDefinition = "jsonb")
    private String formTemplate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private ExamStatusEntity status = ExamStatusEntity.DRAFT;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private JsonNode rulesConfig;


    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PositionEntity> positions = new ArrayList<>();

    // Constructors
    public ExamEntity() {}

    public ExamEntity(UUID id, String code, String title) {
        this.id = id;
        this.code = code;
        this.title = title;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAnnouncement() { return announcement; }
    public void setAnnouncement(String announcement) { this.announcement = announcement; }

    public LocalDateTime getRegistrationStart() { return registrationStart; }
    public void setRegistrationStart(LocalDateTime registrationStart) { this.registrationStart = registrationStart; }

    public LocalDateTime getRegistrationEnd() { return registrationEnd; }
    public void setRegistrationEnd(LocalDateTime registrationEnd) { this.registrationEnd = registrationEnd; }

    public LocalDateTime getExamStart() { return examStart; }
    public void setExamStart(LocalDateTime examStart) { this.examStart = examStart; }

    public LocalDateTime getExamEnd() { return examEnd; }
    public void setExamEnd(LocalDateTime examEnd) { this.examEnd = examEnd; }

    public Boolean getFeeRequired() { return feeRequired; }
    public void setFeeRequired(Boolean feeRequired) { this.feeRequired = feeRequired; }

    public BigDecimal getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; }

    public String getTicketTemplate() { return ticketTemplate; }
    public void setTicketTemplate(String ticketTemplate) { this.ticketTemplate = ticketTemplate; }

    public String getFormTemplate() { return formTemplate; }
    public void setFormTemplate(String formTemplate) { this.formTemplate = formTemplate; }

    public ExamStatusEntity getStatus() { return status; }
    public void setStatus(ExamStatusEntity status) { this.status = status; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public JsonNode getRulesConfig() { return rulesConfig; }
    public void setRulesConfig(JsonNode rulesConfig) { this.rulesConfig = rulesConfig; }

    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<PositionEntity> getPositions() { return positions; }
    public void setPositions(List<PositionEntity> positions) { this.positions = positions; }

    public enum ExamStatusEntity {
        DRAFT, REGISTRATION_OPEN, OPEN, CLOSED, IN_PROGRESS, COMPLETED
    }
}
