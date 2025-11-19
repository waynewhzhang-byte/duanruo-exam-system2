package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 科目JPA实体
 */
@Entity
@Table(name = "subjects")
public class SubjectEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "position_id", nullable = false)
    private UUID positionId;
    
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "duration", nullable = false)
    private Integer durationMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 64)
    private SubjectTypeEntity type;
    
    @Column(name = "max_score", precision = 5, scale = 2)
    private BigDecimal maxScore;
    
    @Column(name = "passing_score", precision = 5, scale = 2)
    private BigDecimal passingScore;
    
    @Column(name = "weight", precision = 3, scale = 2)
    private BigDecimal weight = BigDecimal.ONE;
    
    @Column(name = "ordering")
    private Integer ordering = 0;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "schedule", columnDefinition = "JSONB")
    private JsonNode schedule;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", insertable = false, updatable = false)
    private PositionEntity position;
    
    // Constructors
    public SubjectEntity() {}
    
    public SubjectEntity(UUID id, UUID positionId, String name, Integer durationMinutes, SubjectTypeEntity type) {
        this.id = id;
        this.positionId = positionId;
        this.name = name;
        this.durationMinutes = durationMinutes;
        this.type = type;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    
    public SubjectTypeEntity getType() { return type; }
    public void setType(SubjectTypeEntity type) { this.type = type; }
    
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    
    public BigDecimal getPassingScore() { return passingScore; }
    public void setPassingScore(BigDecimal passingScore) { this.passingScore = passingScore; }
    
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    
    public Integer getOrdering() { return ordering; }
    public void setOrdering(Integer ordering) { this.ordering = ordering; }
    
    public JsonNode getSchedule() { return schedule; }
    public void setSchedule(JsonNode schedule) { this.schedule = schedule; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public PositionEntity getPosition() { return position; }
    public void setPosition(PositionEntity position) { this.position = position; }
    
    public enum SubjectTypeEntity {
        WRITTEN, INTERVIEW, PRACTICAL
    }
}
