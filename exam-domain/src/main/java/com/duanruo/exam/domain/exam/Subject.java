package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.exception.DomainException;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * 科目实体
 */
public class Subject {
    
    private SubjectId id;
    private PositionId positionId;
    private String name;
    private Integer durationMinutes;
    private SubjectType type;
    private BigDecimal maxScore;
    private BigDecimal passingScore;
    private BigDecimal weight;
    private Integer ordering;
    private String schedule; // JSON格式的考试安排
    
    private Subject() {}
    
    /**
     * 创建新科目
     */
    public static Subject create(PositionId positionId, String name, Integer durationMinutes, SubjectType type) {
        if (positionId == null) {
            throw new SubjectCreationException("POSITION_ID_REQUIRED", "岗位ID不能为空");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new SubjectCreationException("SUBJECT_NAME_REQUIRED", "科目名称不能为空");
        }
        if (durationMinutes == null || durationMinutes <= 0) {
            throw new SubjectCreationException("INVALID_DURATION", "考试时长必须大于0");
        }
        if (type == null) {
            throw new SubjectCreationException("SUBJECT_TYPE_REQUIRED", "科目类型不能为空");
        }
        
        Subject subject = new Subject();
        subject.id = SubjectId.newSubjectId();
        subject.positionId = positionId;
        subject.name = name.trim();
        subject.durationMinutes = durationMinutes;
        subject.type = type;
        subject.weight = BigDecimal.ONE; // 默认权重为1.0
        subject.ordering = 0;
        
        return subject;
    }
    
    /**
     * 重建科目（从持久化存储）
     */
    public static Subject rebuild(SubjectId id, PositionId positionId, String name,
                                 Integer durationMinutes, SubjectType type, BigDecimal maxScore,
                                 BigDecimal passingScore, BigDecimal weight, Integer ordering,
                                 String schedule) {
        Subject subject = new Subject();
        subject.id = id;
        subject.positionId = positionId;
        subject.name = name;
        subject.durationMinutes = durationMinutes;
        subject.type = type;
        subject.maxScore = maxScore;
        subject.passingScore = passingScore;
        subject.weight = weight;
        subject.ordering = ordering;
        subject.schedule = schedule;
        
        return subject;
    }
    
    /**
     * 更新科目信息
     */
    public void updateInfo(String name, Integer durationMinutes) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name.trim();
        }
        if (durationMinutes != null && durationMinutes > 0) {
            this.durationMinutes = durationMinutes;
        }
    }
    
    /**
     * 设置评分标准
     */
    public void setScoring(BigDecimal maxScore, BigDecimal passingScore) {
        if (maxScore != null && maxScore.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SubjectOperationException("INVALID_MAX_SCORE", "最高分必须大于0");
        }
        if (passingScore != null && maxScore != null && passingScore.compareTo(maxScore) > 0) {
            throw new SubjectOperationException("INVALID_PASSING_SCORE", "及格分不能大于最高分");
        }
        if (passingScore != null && passingScore.compareTo(BigDecimal.ZERO) < 0) {
            throw new SubjectOperationException("INVALID_PASSING_SCORE", "及格分不能小于0");
        }

        this.maxScore = maxScore;
        this.passingScore = passingScore;
    }

    /**
     * 单独设置最高分
     */
    public void setMaxScore(BigDecimal maxScore) {
        setScoring(maxScore, this.passingScore);
    }

    /**
     * 单独设置及格分
     */
    public void setPassingScore(BigDecimal passingScore) {
        setScoring(this.maxScore, passingScore);
    }

    /**
     * 设置权重
     */
    public void setWeight(BigDecimal weight) {
        if (weight == null || weight.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SubjectOperationException("INVALID_WEIGHT", "权重必须大于0");
        }
        this.weight = weight;
    }

    /**
     * 设置排序
     */
    public void setOrdering(Integer ordering) {
        if (ordering == null || ordering < 0) {
            throw new SubjectOperationException("INVALID_ORDERING", "排序值不能小于0");
        }
        this.ordering = ordering;
    }
    
    /**
     * 设置考试安排
     */
    public void setSchedule(String schedule) {
        // TODO: 验证JSON格式
        this.schedule = schedule;
    }
    
    /**
     * 检查分数是否及格
     */
    public boolean isPassing(BigDecimal score) {
        if (score == null || passingScore == null) {
            return false;
        }
        return score.compareTo(passingScore) >= 0;
    }
    
    // Getters
    public SubjectId getId() { return id; }
    public PositionId getPositionId() { return positionId; }
    public String getName() { return name; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public SubjectType getType() { return type; }
    public BigDecimal getMaxScore() { return maxScore; }
    public BigDecimal getPassingScore() { return passingScore; }
    public BigDecimal getWeight() { return weight; }
    public Integer getOrdering() { return ordering; }
    public String getSchedule() { return schedule; }

    /**
     * 更新科目类型
     */
    public void setType(SubjectType type) {
        if (type == null) {
            throw new SubjectOperationException("SUBJECT_TYPE_REQUIRED", "科目类型不能为空");
        }
        this.type = type;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Subject subject = (Subject) o;
        return Objects.equals(id, subject.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Subject{" +
                "id=" + id +
                ", positionId=" + positionId +
                ", name='" + name + '\'' +
                ", type=" + type +
                '}';
    }
    
    /**
     * 科目创建异常
     */
    public static class SubjectCreationException extends DomainException {
        public SubjectCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
    
    /**
     * 科目操作异常
     */
    public static class SubjectOperationException extends DomainException {
        public SubjectOperationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
}
