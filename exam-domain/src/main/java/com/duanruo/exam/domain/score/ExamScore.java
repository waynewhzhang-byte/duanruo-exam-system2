package com.duanruo.exam.domain.score;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.SubjectId;
import com.duanruo.exam.domain.user.UserId;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 考试成绩聚合根
 * 表示候选人在某个科目的考试成绩
 */
public class ExamScore {

    private final ExamScoreId id;
    private final ApplicationId applicationId;
    private final SubjectId subjectId;
    private BigDecimal score;
    private boolean isAbsent;
    private UserId gradedBy;
    private LocalDateTime gradedAt;
    private String remarks;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 私有构造函数，通过工厂方法创建
    private ExamScore(ExamScoreId id, ApplicationId applicationId, SubjectId subjectId,
                     BigDecimal score, boolean isAbsent, UserId gradedBy, 
                     LocalDateTime gradedAt, String remarks) {
        this.id = id;
        this.applicationId = applicationId;
        this.subjectId = subjectId;
        this.score = score;
        this.isAbsent = isAbsent;
        this.gradedBy = gradedBy;
        this.gradedAt = gradedAt;
        this.remarks = remarks;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        validateScore();
    }

    /**
     * 创建新的考试成绩
     */
    public static ExamScore create(ApplicationId applicationId, SubjectId subjectId,
                                  BigDecimal score, UserId gradedBy, String remarks) {
        if (score.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("成绩不能为负数");
        }
        
        return new ExamScore(
            ExamScoreId.newExamScoreId(),
            applicationId,
            subjectId,
            score,
            false, // 有成绩就不是缺考
            gradedBy,
            LocalDateTime.now(),
            remarks
        );
    }

    /**
     * 创建缺考记录
     */
    public static ExamScore createAbsent(ApplicationId applicationId, SubjectId subjectId,
                                        UserId gradedBy, String remarks) {
        return new ExamScore(
            ExamScoreId.newExamScoreId(),
            applicationId,
            subjectId,
            BigDecimal.ZERO,
            true,
            gradedBy,
            LocalDateTime.now(),
            remarks
        );
    }

    /**
     * 从持久化数据重建
     */
    public static ExamScore reconstruct(ExamScoreId id, ApplicationId applicationId, SubjectId subjectId,
                                       BigDecimal score, boolean isAbsent, UserId gradedBy,
                                       LocalDateTime gradedAt, String remarks,
                                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        ExamScore examScore = new ExamScore(id, applicationId, subjectId, score, isAbsent, 
                                          gradedBy, gradedAt, remarks);
        examScore.updatedAt = updatedAt;
        return examScore;
    }

    /**
     * 更新成绩
     */
    public void updateScore(BigDecimal newScore, UserId gradedBy, String remarks) {
        if (newScore.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("成绩不能为负数");
        }
        
        this.score = newScore;
        this.isAbsent = false; // 有成绩就不是缺考
        this.gradedBy = gradedBy;
        this.gradedAt = LocalDateTime.now();
        this.remarks = remarks;
        this.updatedAt = LocalDateTime.now();
        
        validateScore();
    }

    /**
     * 标记为缺考
     */
    public void markAsAbsent(UserId gradedBy, String remarks) {
        this.score = BigDecimal.ZERO;
        this.isAbsent = true;
        this.gradedBy = gradedBy;
        this.gradedAt = LocalDateTime.now();
        this.remarks = remarks;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否及格（需要科目信息）
     */
    public boolean isPassing(BigDecimal passingScore) {
        if (isAbsent) {
            return false;
        }
        return score.compareTo(passingScore) >= 0;
    }

    /**
     * 获取成绩等级
     */
    public ScoreGrade getGrade(BigDecimal passingScore, BigDecimal excellentScore) {
        if (isAbsent) {
            return ScoreGrade.ABSENT;
        }
        
        if (score.compareTo(excellentScore) >= 0) {
            return ScoreGrade.EXCELLENT;
        } else if (score.compareTo(passingScore) >= 0) {
            return ScoreGrade.PASS;
        } else {
            return ScoreGrade.FAIL;
        }
    }

    /**
     * 验证成绩的有效性
     */
    private void validateScore() {
        if (isAbsent && score.compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalStateException("缺考状态下成绩必须为0");
        }
        
        if (!isAbsent && score.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("非缺考状态下成绩不能为负数");
        }
    }

    // Getters
    public ExamScoreId getId() {
        return id;
    }

    public ApplicationId getApplicationId() {
        return applicationId;
    }

    public SubjectId getSubjectId() {
        return subjectId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public boolean isAbsent() {
        return isAbsent;
    }

    public UserId getGradedBy() {
        return gradedBy;
    }

    public LocalDateTime getGradedAt() {
        return gradedAt;
    }

    public String getRemarks() {
        return remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public String toString() {
        return "ExamScore{" +
                "id=" + getId() +
                ", applicationId=" + applicationId +
                ", subjectId=" + subjectId +
                ", score=" + score +
                ", isAbsent=" + isAbsent +
                ", gradedBy=" + gradedBy +
                ", gradedAt=" + gradedAt +
                ", remarks='" + remarks + '\'' +
                '}';
    }
}

/**
 * 成绩等级枚举
 */
enum ScoreGrade {
    EXCELLENT("优秀"),
    PASS("及格"),
    FAIL("不及格"),
    ABSENT("缺考");

    private final String description;

    ScoreGrade(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
