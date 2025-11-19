package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ticket_number_rules")
public class TicketNumberRuleEntity {
    @Id
    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "custom_prefix", length = 50)
    private String customPrefix;

    @Column(name = "include_exam_code", nullable = false)
    private boolean includeExamCode = true;

    @Column(name = "include_position_code", nullable = false)
    private boolean includePositionCode = true;

    @Column(name = "date_format", length = 20, nullable = false)
    private String dateFormat = "YYYYMMDD";

    @Column(name = "sequence_length", nullable = false)
    private int sequenceLength;

    @Column(name = "sequence_start", nullable = false)
    private int sequenceStart;

    @Column(name = "daily_reset", nullable = false)
    private boolean dailyReset;

    @Column(name = "checksum_type", length = 20, nullable = false)
    private String checksumType;

    @Column(name = "separator", length = 10, nullable = false)
    private String separator = "-";

    @Column(name = "include_date", nullable = false)
    private boolean includeDate = true; // 保留用于向后兼容

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected TicketNumberRuleEntity() {}

    public TicketNumberRuleEntity(UUID examId, boolean includeDate, int sequenceLength, int sequenceStart,
                                  boolean dailyReset, String checksumType) {
        this.examId = examId;
        this.includeDate = includeDate;
        this.includeExamCode = true;
        this.includePositionCode = true;
        this.dateFormat = includeDate ? "YYYYMMDD" : "NONE";
        this.sequenceLength = sequenceLength;
        this.sequenceStart = sequenceStart;
        this.dailyReset = dailyReset;
        this.checksumType = checksumType;
        this.separator = "-";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public TicketNumberRuleEntity(UUID examId, String customPrefix, boolean includeExamCode,
                                  boolean includePositionCode, String dateFormat,
                                  int sequenceLength, int sequenceStart,
                                  boolean dailyReset, String checksumType, String separator) {
        this.examId = examId;
        this.customPrefix = customPrefix;
        this.includeExamCode = includeExamCode;
        this.includePositionCode = includePositionCode;
        this.dateFormat = dateFormat;
        this.sequenceLength = sequenceLength;
        this.sequenceStart = sequenceStart;
        this.dailyReset = dailyReset;
        this.checksumType = checksumType;
        this.separator = separator;
        this.includeDate = !"NONE".equals(dateFormat);
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    // getters/setters
    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }

    public String getCustomPrefix() { return customPrefix; }
    public void setCustomPrefix(String customPrefix) { this.customPrefix = customPrefix; }

    public boolean isIncludeExamCode() { return includeExamCode; }
    public void setIncludeExamCode(boolean includeExamCode) { this.includeExamCode = includeExamCode; }

    public boolean isIncludePositionCode() { return includePositionCode; }
    public void setIncludePositionCode(boolean includePositionCode) { this.includePositionCode = includePositionCode; }

    public String getDateFormat() { return dateFormat; }
    public void setDateFormat(String dateFormat) { this.dateFormat = dateFormat; }

    public int getSequenceLength() { return sequenceLength; }
    public void setSequenceLength(int sequenceLength) { this.sequenceLength = sequenceLength; }

    public int getSequenceStart() { return sequenceStart; }
    public void setSequenceStart(int sequenceStart) { this.sequenceStart = sequenceStart; }

    public boolean isDailyReset() { return dailyReset; }
    public void setDailyReset(boolean dailyReset) { this.dailyReset = dailyReset; }

    public String getChecksumType() { return checksumType; }
    public void setChecksumType(String checksumType) { this.checksumType = checksumType; }

    public String getSeparator() { return separator; }
    public void setSeparator(String separator) { this.separator = separator; }

    public boolean isIncludeDate() { return includeDate; }
    public void setIncludeDate(boolean includeDate) { this.includeDate = includeDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

