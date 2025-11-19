package com.duanruo.exam.domain.exam;

import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 考试聚合根
 */
public class Exam {

    private ExamId id;
    private String code;
    private String slug;
    private String title;
    private String description;
    private String announcement;
    private LocalDateTime registrationStart;
    private LocalDateTime registrationEnd;
    private LocalDateTime examStart;  // 考试举行开始时间
    private LocalDateTime examEnd;    // 考试举行结束时间
    private boolean feeRequired;
    private java.math.BigDecimal feeAmount;
    private String ticketTemplate;
    private String formTemplate; // JSON格式的报名表单模板
    private ExamStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Position> positions;
    private String rulesConfig; // JSON string for rules configuration


    // 私有构造函数，强制使用工厂方法
    private Exam() {
        this.positions = new ArrayList<>();
    }

    /**
     * 创建新考试
     */
    public static Exam create(String code, String title, String description, String createdBy) {
        return create(code, title, description, createdBy, null);
    }

    /**
     * 创建新考试（带自定义slug）
     */
    public static Exam create(String code, String title, String description, String createdBy, String slug) {
        if (code == null || code.trim().isEmpty()) {
            throw new ExamCreationException("EXAM_CODE_REQUIRED", "考试代码不能为空");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new ExamCreationException("EXAM_TITLE_REQUIRED", "考试标题不能为空");
        }
        if (createdBy == null || createdBy.trim().isEmpty()) {
            throw new ExamCreationException("CREATOR_REQUIRED", "创建者不能为空");
        }

        Exam exam = new Exam();
        exam.id = ExamId.newExamId();
        exam.code = code.trim();
        exam.slug = slug != null ? slug.trim() : generateSlugFromCode(code.trim());
        exam.title = title.trim();
        exam.description = description != null ? description.trim() : "";
        exam.status = ExamStatus.DRAFT;
        exam.feeRequired = false;
        exam.createdBy = createdBy;
        exam.createdAt = LocalDateTime.now();
        exam.updatedAt = LocalDateTime.now();

        return exam;
    }

    /**
     * 重建考试（从持久化存储）
     */
    public static Exam rebuild(ExamId id, String code, String title, String description,
                              String announcement, LocalDateTime registrationStart,
                              LocalDateTime registrationEnd, boolean feeRequired,
                              java.math.BigDecimal feeAmount, String ticketTemplate,
                              ExamStatus status, String createdBy, LocalDateTime createdAt,
                              LocalDateTime updatedAt) {
        return rebuild(id, code, null, title, description, announcement, registrationStart,
                registrationEnd, null, null, feeRequired, feeAmount, ticketTemplate, null, status, createdBy, createdAt, updatedAt);
    }

    /**
     * 重建考试（从持久化存储，带slug）
     */
    public static Exam rebuild(ExamId id, String code, String slug, String title, String description,
                              String announcement, LocalDateTime registrationStart,
                              LocalDateTime registrationEnd, LocalDateTime examStart, LocalDateTime examEnd,
                              boolean feeRequired, java.math.BigDecimal feeAmount, String ticketTemplate,
                              String formTemplate,
                              ExamStatus status, String createdBy, LocalDateTime createdAt,
                              LocalDateTime updatedAt) {
        Exam exam = new Exam();
        exam.id = id;
        exam.code = code;
        exam.slug = slug;
        exam.title = title;
        exam.description = description;
        exam.announcement = announcement;
        exam.registrationStart = registrationStart;
        exam.registrationEnd = registrationEnd;
        exam.examStart = examStart;
        exam.examEnd = examEnd;
        exam.feeRequired = feeRequired;
        exam.feeAmount = feeAmount;
        exam.ticketTemplate = ticketTemplate;
        exam.formTemplate = formTemplate;
        exam.status = status;
        exam.createdBy = createdBy;
        exam.createdAt = createdAt;
        exam.updatedAt = updatedAt;

        return exam;
    }

    /**
     * 重建考试（带规则配置）
     */
    public static Exam rebuildWithRules(ExamId id, String code, String title, String description,
                                        String announcement, LocalDateTime registrationStart,
                                        LocalDateTime registrationEnd, boolean feeRequired,
                                        java.math.BigDecimal feeAmount, String ticketTemplate,
                                        ExamStatus status, String createdBy, LocalDateTime createdAt,
                                        LocalDateTime updatedAt, String rulesConfig) {
        return rebuildWithRules(id, code, null, title, description, announcement, registrationStart,
                registrationEnd, null, null, feeRequired, feeAmount, ticketTemplate, status, createdBy, createdAt, updatedAt, rulesConfig);
    }

    /**
     * 重建考试（带规则配置和slug）
     */
    public static Exam rebuildWithRules(ExamId id, String code, String slug, String title, String description,
                                        String announcement, LocalDateTime registrationStart,
                                        LocalDateTime registrationEnd, LocalDateTime examStart, LocalDateTime examEnd,
                                        boolean feeRequired, java.math.BigDecimal feeAmount, String ticketTemplate,
                                        ExamStatus status, String createdBy, LocalDateTime createdAt,
                                        LocalDateTime updatedAt, String rulesConfig) {
        Exam exam = rebuild(id, code, slug, title, description, announcement, registrationStart,
                registrationEnd, examStart, examEnd, feeRequired, feeAmount, ticketTemplate, null, status, createdBy, createdAt, updatedAt);
        exam.rulesConfig = rulesConfig;
        return exam;
    }

    /**
     * 重建考试（带表单模板和规则配置）
     */
    public static Exam rebuildWithFormTemplateAndRules(ExamId id, String code, String slug, String title, String description,
                                        String announcement, LocalDateTime registrationStart,
                                        LocalDateTime registrationEnd, LocalDateTime examStart, LocalDateTime examEnd,
                                        boolean feeRequired, java.math.BigDecimal feeAmount, String ticketTemplate,
                                        String formTemplate,
                                        ExamStatus status, String createdBy, LocalDateTime createdAt,
                                        LocalDateTime updatedAt, String rulesConfig) {
        Exam exam = rebuild(id, code, slug, title, description, announcement, registrationStart,
                registrationEnd, examStart, examEnd, feeRequired, feeAmount, ticketTemplate, formTemplate, status, createdBy, createdAt, updatedAt);
        exam.rulesConfig = rulesConfig;
        return exam;
    }

    public String getRulesConfig() { return rulesConfig; }

    public void updateRulesConfig(String rulesConfig) {
        this.rulesConfig = rulesConfig;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 设置准考证模板
     */
    public void setTicketTemplate(String ticketTemplate) {
        this.ticketTemplate = ticketTemplate;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 设置报名表单模板
     */
    public void setFormTemplate(String formTemplate) {
        this.formTemplate = formTemplate;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 更新考试基本信息
     */
    public void updateBasicInfo(String title, String description, String announcement) {
        if (status == ExamStatus.CLOSED) {
            throw new ExamOperationException("EXAM_CLOSED", "已关闭的考试不能修改");
        }

        if (title != null && !title.trim().isEmpty()) {
            this.title = title.trim();
        }
        if (description != null) {
            this.description = description.trim();
        }
        if (announcement != null) {
            this.announcement = announcement.trim();
        }

        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 设置报名时间
     */
    public void setRegistrationPeriod(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new ExamOperationException("INVALID_REGISTRATION_PERIOD", "报名开始和结束时间不能为空");
        }
        if (start.isAfter(end)) {
            throw new ExamOperationException("INVALID_REGISTRATION_PERIOD", "报名开始时间不能晚于结束时间");
        }
        if (status == ExamStatus.OPEN && start.isBefore(LocalDateTime.now())) {
            throw new ExamOperationException("INVALID_REGISTRATION_PERIOD", "已开放的考试不能设置过去的报名时间");
        }

        this.registrationStart = start;
        this.registrationEnd = end;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 设置考试举行时间
     */
    public void setExamSchedule(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new ExamOperationException("INVALID_EXAM_SCHEDULE", "考试开始时间不能晚于结束时间");
        }

        this.examStart = start;
        this.examEnd = end;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 设置考试费用
     */
    public void setFee(boolean required, java.math.BigDecimal amount) {
        if (required && (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0)) {
            throw new ExamOperationException("INVALID_FEE", "收费考试的费用必须大于0");
        }

        this.feeRequired = required;
        this.feeAmount = required ? amount : null;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 开放考试报名
     */
    public void open() {
        if (status != ExamStatus.DRAFT) {
            throw new ExamOperationException("INVALID_STATUS_TRANSITION", "只有草稿状态的考试才能开放");
        }
        if (registrationStart == null || registrationEnd == null) {
            throw new ExamOperationException("REGISTRATION_PERIOD_NOT_SET", "必须先设置报名时间");
        }
        if (positions.isEmpty()) {
            throw new ExamOperationException("NO_POSITIONS", "考试必须至少有一个岗位");
        }

        this.status = ExamStatus.OPEN;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 关闭考试报名
     */
    public void close() {
        if (status != ExamStatus.OPEN) {
            throw new ExamOperationException("INVALID_STATUS_TRANSITION", "只有开放状态的考试才能关闭");
        }

        this.status = ExamStatus.CLOSED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 开始考试
     */
    public void startExam() {
        if (status != ExamStatus.CLOSED) {
            throw new ExamOperationException("INVALID_STATUS_TRANSITION", "只有报名关闭的考试才能开始");
        }

        this.status = ExamStatus.IN_PROGRESS;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 完成考试
     */
    public void complete() {
        if (status != ExamStatus.IN_PROGRESS) {
            throw new ExamOperationException("INVALID_STATUS_TRANSITION", "只有进行中的考试才能完成");
        }

        this.status = ExamStatus.COMPLETED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否在报名期内
     */
    public boolean isRegistrationOpen() {
        if (status != ExamStatus.OPEN) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        return registrationStart != null && registrationEnd != null &&
               !now.isBefore(registrationStart) && !now.isAfter(registrationEnd);
    }

    /**
     * 添加岗位（业务操作）
     */
    public void addPosition(Position position) {
        if (position == null) {
            throw new ExamOperationException("POSITION_REQUIRED", "岗位不能为空");
        }
        if (status == ExamStatus.CLOSED || status == ExamStatus.IN_PROGRESS || status == ExamStatus.COMPLETED) {
            throw new ExamOperationException("EXAM_CLOSED", "已关闭的考试不能添加岗位");
        }

        this.positions.add(position);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 添加岗位（用于重建领域对象，不检查状态）
     * 仅供基础设施层使用
     */
    public void addPositionForRebuild(Position position) {
        if (position == null) {
            throw new ExamOperationException("POSITION_REQUIRED", "岗位不能为空");
        }
        this.positions.add(position);
    }

    // Getters
    public ExamId getId() { return id; }
    public String getCode() { return code; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getAnnouncement() { return announcement; }
    public LocalDateTime getRegistrationStart() { return registrationStart; }
    public LocalDateTime getRegistrationEnd() { return registrationEnd; }
    public LocalDateTime getExamStart() { return examStart; }
    public LocalDateTime getExamEnd() { return examEnd; }
    public boolean isFeeRequired() { return feeRequired; }
    public java.math.BigDecimal getFeeAmount() { return feeAmount; }
    public String getTicketTemplate() { return ticketTemplate; }
    public String getFormTemplate() { return formTemplate; }
    public ExamStatus getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<Position> getPositions() { return new ArrayList<>(positions); }

    /**
     * 设置考试slug
     */
    public void setSlug(String slug) {
        if (slug != null && !isValidSlug(slug)) {
            throw new ExamOperationException("INVALID_SLUG", "Slug格式无效，只能包含字母、数字和连字符");
        }
        this.slug = slug;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 从考试代码生成slug
     */
    private static String generateSlugFromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        return code.toLowerCase()
                .replaceAll("[^a-z0-9\\-_]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * 验证slug格式
     */
    private static boolean isValidSlug(String slug) {
        if (slug == null || slug.trim().isEmpty()) {
            return false;
        }
        return slug.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Exam exam = (Exam) o;
        return Objects.equals(id, exam.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Exam{" +
                "id=" + id +
                ", code='" + code + '\'' +
                ", title='" + title + '\'' +
                ", status=" + status +
                '}';
    }

    /**
     * 考试创建异常
     */
    public static class ExamCreationException extends DomainException {
        public ExamCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }

    /**
     * 考试操作异常
     */
    public static class ExamOperationException extends DomainException {
        public ExamOperationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
}
