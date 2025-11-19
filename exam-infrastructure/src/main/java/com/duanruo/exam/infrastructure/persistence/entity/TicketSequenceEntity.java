package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ticket_sequences")
@IdClass(TicketSequenceEntity.TicketSequenceId.class)
public class TicketSequenceEntity {
    @Id
    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Id
    @Column(name = "scope", nullable = false, length = 16)
    private String scope; // GLOBAL or DAILY

    @Id
    @Column(name = "counter_date", nullable = false)
    private LocalDate counterDate;

    @Column(name = "current_value", nullable = false)
    private long currentValue;

    protected TicketSequenceEntity() {}

    public TicketSequenceEntity(UUID examId, String scope, LocalDate counterDate, long currentValue) {
        this.examId = examId; this.scope = scope; this.counterDate = counterDate; this.currentValue = currentValue;
    }

    // getters/setters
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public LocalDate getCounterDate() { return counterDate; }
    public void setCounterDate(LocalDate counterDate) { this.counterDate = counterDate; }
    public long getCurrentValue() { return currentValue; }
    public void setCurrentValue(long currentValue) { this.currentValue = currentValue; }

    // composite key
    public static class TicketSequenceId implements java.io.Serializable {
        private UUID examId;
        private String scope;
        private LocalDate counterDate;
        public TicketSequenceId() {}
        public TicketSequenceId(UUID examId, String scope, LocalDate counterDate) {
            this.examId = examId; this.scope = scope; this.counterDate = counterDate;
        }
        @Override public int hashCode() { return java.util.Objects.hash(examId, scope, counterDate); }
        @Override public boolean equals(Object o) {
            if (this == o) return true; if (o == null || getClass() != o.getClass()) return false;
            TicketSequenceId that = (TicketSequenceId) o;
            return java.util.Objects.equals(examId, that.examId) && java.util.Objects.equals(scope, that.scope)
                    && java.util.Objects.equals(counterDate, that.counterDate);
        }
    }
}

