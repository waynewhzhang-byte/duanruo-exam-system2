package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "venues", indexes = {
        @Index(name = "idx_venues_exam_id", columnList = "exam_id"),
        @Index(name = "idx_venues_name", columnList = "name")
})
public class VenueEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "seat_map_json", columnDefinition = "JSONB")
    private JsonNode seatMapJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected VenueEntity() {}

    public VenueEntity(UUID id, UUID examId, String name, Integer capacity) {
        this.id = id; this.examId = examId; this.name = name; this.capacity = capacity;
        this.createdAt = LocalDateTime.now(); this.updatedAt = this.createdAt;
    }

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public JsonNode getSeatMapJson() { return seatMapJson; }
    public void setSeatMapJson(JsonNode seatMapJson) { this.seatMapJson = seatMapJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

