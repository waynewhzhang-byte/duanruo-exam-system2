package com.duanruo.exam.domain.venue;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 领域实体：考场
 * 注意：Domain 层不引入任何 JPA 注解
 */
public class Venue {
    private VenueId id;
    private ExamId examId;
    private String name;
    private Integer capacity; // 总可用席位数（不含不可用的）
    private String seatMapJson; // 可选：座位图 JSON
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Venue() {}

    public static Venue create(ExamId examId, String name, Integer capacity) {
        if (examId == null) throw new VenueException("EXAM_ID_REQUIRED", "考试ID不能为空");
        if (name == null || name.isBlank()) throw new VenueException("NAME_REQUIRED", "考场名称不能为空");
        if (capacity == null || capacity <= 0) throw new VenueException("CAPACITY_INVALID", "考场容量必须大于0");
        Venue v = new Venue();
        v.id = VenueId.newId();
        v.examId = examId;
        v.name = name.trim();
        v.capacity = capacity;
        v.createdAt = LocalDateTime.now();
        v.updatedAt = LocalDateTime.now();
        return v;
    }

    public static Venue rebuild(VenueId id, ExamId examId, String name, Integer capacity,
                                String seatMapJson, LocalDateTime createdAt, LocalDateTime updatedAt) {
        Venue v = new Venue();
        v.id = id;
        v.examId = examId;
        v.name = name;
        v.capacity = capacity;
        v.seatMapJson = seatMapJson;
        v.createdAt = createdAt;
        v.updatedAt = updatedAt;
        return v;
    }

    public void update(String name, Integer capacity, String seatMapJson) {
        if (name != null && !name.isBlank()) this.name = name.trim();
        if (capacity != null) {
            if (capacity <= 0) throw new VenueException("CAPACITY_INVALID", "考场容量必须大于0");
            this.capacity = capacity;
        }
        if (seatMapJson != null) this.seatMapJson = seatMapJson;
        this.updatedAt = LocalDateTime.now();
    }

    public VenueId getId() { return id; }
    public ExamId getExamId() { return examId; }
    public String getName() { return name; }
    public Integer getCapacity() { return capacity; }
    public String getSeatMapJson() { return seatMapJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Venue venue = (Venue) o;
        return Objects.equals(id, venue.id);
    }
    @Override public int hashCode() { return Objects.hash(id); }

    public static class VenueException extends DomainException {
        public VenueException(String errorCode, String message) { super(errorCode, message); }
    }
}

