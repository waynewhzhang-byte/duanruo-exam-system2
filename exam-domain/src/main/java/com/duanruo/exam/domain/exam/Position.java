package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.exception.DomainException;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 岗位实体
 */
public class Position {
    
    private PositionId id;
    private ExamId examId;
    private String code;
    private String title;
    private String description;
    private String requirements;
    private Integer quota;
    private String seatRuleId;
    private List<Subject> subjects;
    
    private Position() {
        this.subjects = new ArrayList<>();
    }
    
    /**
     * 创建新岗位
     */
    public static Position create(ExamId examId, String code, String title) {
        if (examId == null) {
            throw new PositionCreationException("EXAM_ID_REQUIRED", "考试ID不能为空");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new PositionCreationException("POSITION_CODE_REQUIRED", "岗位代码不能为空");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new PositionCreationException("POSITION_TITLE_REQUIRED", "岗位标题不能为空");
        }
        
        Position position = new Position();
        position.id = PositionId.newPositionId();
        position.examId = examId;
        position.code = code.trim();
        position.title = title.trim();
        
        return position;
    }
    
    /**
     * 重建岗位（从持久化存储）
     */
    public static Position rebuild(PositionId id, ExamId examId, String code, String title,
                                  String description, String requirements, Integer quota,
                                  String seatRuleId) {
        Position position = new Position();
        position.id = id;
        position.examId = examId;
        position.code = code;
        position.title = title;
        position.description = description;
        position.requirements = requirements;
        position.quota = quota;
        position.seatRuleId = seatRuleId;
        return position;
    }
    
    /**
     * 更新岗位信息
     */
    public void updateInfo(String title, String description, String requirements) {
        if (title != null && !title.trim().isEmpty()) {
            this.title = title.trim();
        }
        if (description != null) {
            this.description = description.trim();
        }
        if (requirements != null) {
            this.requirements = requirements.trim();
        }
    }
    
    /**
     * 设置招聘配额
     */
    public void setQuota(Integer quota) {
        if (quota != null && quota <= 0) {
            throw new PositionOperationException("INVALID_QUOTA", "招聘配额必须大于0");
        }
        this.quota = quota;
    }

    /**
     * 设置座位分配规则
     */
    public void setSeatRuleId(String seatRuleId) {
        this.seatRuleId = seatRuleId;
    }
    
    /**
     * 添加科目
     */
    public void addSubject(Subject subject) {
        if (subject == null) {
            throw new PositionOperationException("SUBJECT_REQUIRED", "科目不能为空");
        }
        this.subjects.add(subject);
    }
    
    /**
     * 移除科目
     */
    public void removeSubject(SubjectId subjectId) {
        if (subjectId == null) {
            throw new PositionOperationException("SUBJECT_ID_REQUIRED", "科目ID不能为空");
        }
        this.subjects.removeIf(subject -> subject.getId().equals(subjectId));
    }
    
    /**
     * 检查是否有配额限制
     */
    public boolean hasQuotaLimit() {
        return quota != null && quota > 0;
    }
    
    /**
     * 检查是否还有可用配额
     */
    public boolean hasAvailableQuota(int currentApplicationCount) {
        if (!hasQuotaLimit()) {
            return true;
        }
        return currentApplicationCount < quota;
    }
    
    // Getters
    public PositionId getId() { return id; }
    public ExamId getExamId() { return examId; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getRequirements() { return requirements; }
    public Integer getQuota() { return quota; }
    public String getSeatRuleId() { return seatRuleId; }
    public List<Subject> getSubjects() { return new ArrayList<>(subjects); }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Position position = (Position) o;
        return Objects.equals(id, position.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Position{" +
                "id=" + id +
                ", examId=" + examId +
                ", code='" + code + '\'' +
                ", title='" + title + '\'' +
                '}';
    }
    
    /**
     * 岗位创建异常
     */
    public static class PositionCreationException extends DomainException {
        public PositionCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
    
    /**
     * 岗位操作异常
     */
    public static class PositionOperationException extends DomainException {
        public PositionOperationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
}
