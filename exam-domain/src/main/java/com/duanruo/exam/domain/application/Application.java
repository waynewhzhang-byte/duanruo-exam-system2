package com.duanruo.exam.domain.application;

import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 报名申请聚合根
 */
public class Application {

    private ApplicationId id;
    private ExamId examId;
    private PositionId positionId;
    private CandidateId candidateId;
    private Integer formVersion;
    private String payload; // JSON格式的表单数据
    private ApplicationStatus status;
    private String autoCheckResult; // JSON格式的自动审核结果
    private String finalDecision; // JSON格式的最终决定
    private LocalDateTime submittedAt;
    private LocalDateTime statusUpdatedAt;
    private Long version; // 乐观锁版本号
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Application() {}

    /**
     * 创建新的报名申请
     */
    public static Application create(ExamId examId, PositionId positionId, CandidateId candidateId) {
        if (examId == null) {
            throw new ApplicationCreationException("EXAM_ID_REQUIRED", "考试ID不能为空");
        }
        if (positionId == null) {
            throw new ApplicationCreationException("POSITION_ID_REQUIRED", "岗位ID不能为空");
        }
        if (candidateId == null) {
            throw new ApplicationCreationException("CANDIDATE_ID_REQUIRED", "候选人ID不能为空");
        }

        Application application = new Application();
        application.id = ApplicationId.newApplicationId();
        application.examId = examId;
        application.positionId = positionId;
        application.candidateId = candidateId;
        application.formVersion = 1;
        application.status = ApplicationStatus.DRAFT;
        application.version = 0L;
        application.createdAt = LocalDateTime.now();
        application.updatedAt = LocalDateTime.now();

        return application;
    }

    /**
     * 重建报名申请（从持久化存储）
     */
    public static Application rebuild(ApplicationId id, ExamId examId, PositionId positionId,
                                     CandidateId candidateId, Integer formVersion, String payload,
                                     ApplicationStatus status, String autoCheckResult,
                                     String finalDecision, LocalDateTime submittedAt,
                                     LocalDateTime statusUpdatedAt, Long version,
                                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        Application application = new Application();
        application.id = id;
        application.examId = examId;
        application.positionId = positionId;
        application.candidateId = candidateId;
        application.formVersion = formVersion;
        application.payload = payload;
        application.status = status;
        application.autoCheckResult = autoCheckResult;
        application.finalDecision = finalDecision;
        application.submittedAt = submittedAt;
        application.statusUpdatedAt = statusUpdatedAt;
        application.version = version;
        application.createdAt = createdAt;
        application.updatedAt = updatedAt;

        return application;
    }

    /**
     * 更新表单数据
     */
    public void updateFormData(String payload) {
        if (status != ApplicationStatus.DRAFT && status != ApplicationStatus.RETURNED_FOR_RESUBMISSION) {
            throw new ApplicationOperationException("CANNOT_UPDATE_SUBMITTED", "仅草稿或被退回待重提的申请可以修改");
        }
        if (payload == null || payload.trim().isEmpty()) {
            throw new ApplicationOperationException("PAYLOAD_REQUIRED", "表单数据不能为空");
        }

        this.payload = payload;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 提交申请
     */
    public void submit() {
        if (status != ApplicationStatus.DRAFT) {
            throw new ApplicationOperationException("INVALID_STATUS_TRANSITION",
                "只有草稿状态的申请才能提交");
        }
        if (payload == null || payload.trim().isEmpty()) {
            throw new ApplicationOperationException("PAYLOAD_REQUIRED", "必须先填写表单数据");
        }

        this.status = ApplicationStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }


    /**
     * 重提（针对已被退回的申请）
     */
    public void resubmit() {
        if (status != ApplicationStatus.RETURNED_FOR_RESUBMISSION) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_RESUBMIT",
                "仅退回待重提的申请可以重新提交");
        }
        if (payload == null || payload.trim().isEmpty()) {
            throw new ApplicationOperationException("PAYLOAD_REQUIRED", "必须先填写/更新表单数据");
        }
        this.status = ApplicationStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 撤销申请
     */
    public void withdraw() {
        if (status.isTerminal()) {
            throw new ApplicationOperationException("CANNOT_WITHDRAW_TERMINAL",
                "已完成的申请不能撤销");
        }
        if (status == ApplicationStatus.WITHDRAWN) {
            throw new ApplicationOperationException("ALREADY_WITHDRAWN", "申请已经撤销");
        }

        this.status = ApplicationStatus.WITHDRAWN;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 应用自动审核结果
     */
    public void applyAutoReviewResult(String result, ApplicationStatus newStatus) {
        if (status != ApplicationStatus.SUBMITTED) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_AUTO_REVIEW",
                "只有已提交的申请才能进行自动审核");
        }
        if (!status.canTransitionTo(newStatus)) {
            throw new ApplicationOperationException("INVALID_STATUS_TRANSITION",
                "不能从" + status + "转换到" + newStatus);
        }

        this.autoCheckResult = result;
        this.status = newStatus;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 应用审核决定
     */
    public void applyReviewDecision(ApplicationStatus newStatus, String decision) {
        if (!status.canTransitionTo(newStatus)) {
            throw new ApplicationOperationException("INVALID_STATUS_TRANSITION",
                "不能从" + status + "转换到" + newStatus);
        }

        this.finalDecision = decision;
        this.status = newStatus;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为已缴费
     */
    public void markAsPaid() {
        if (status != ApplicationStatus.APPROVED) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_PAYMENT",
                "只有已通过审核的申请才能缴费");
        }

        this.status = ApplicationStatus.PAID;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为已发放准考证
     */
    public void markAsTicketIssued() {
        if (status != ApplicationStatus.PAID && status != ApplicationStatus.APPROVED) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_TICKET",
                "只有已缴费或免费考试已通过审核的申请才能发放准考证");
        }

        this.status = ApplicationStatus.TICKET_ISSUED;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 更新申请状态
     */
    public void updateStatus(ApplicationStatus newStatus) {
        if (!status.canTransitionTo(newStatus)) {
            throw new ApplicationOperationException("INVALID_STATUS_TRANSITION",
                "不能从" + status + "转换到" + newStatus);
        }

        this.status = newStatus;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记笔试完成
     */
    public void markWrittenExamCompleted() {
        if (status != ApplicationStatus.TICKET_ISSUED) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_EXAM_COMPLETION",
                "只有已发放准考证的申请才能标记为笔试完成");
        }

        this.status = ApplicationStatus.WRITTEN_EXAM_COMPLETED;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记面试完成
     */
    public void markInterviewCompleted() {
        if (status != ApplicationStatus.INTERVIEW_ELIGIBLE) {
            throw new ApplicationOperationException("INVALID_STATUS_FOR_INTERVIEW_COMPLETION",
                "只有有面试资格的申请才能标记为面试完成");
        }

        this.status = ApplicationStatus.INTERVIEW_COMPLETED;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为已过期
     */
    public void markAsExpired() {
        if (status.isTerminal()) {
            throw new ApplicationOperationException("CANNOT_EXPIRE_TERMINAL",
                "已完成的申请不能标记为过期");
        }

        this.status = ApplicationStatus.EXPIRED;
        this.statusUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否可以撤销
     */
    public boolean canWithdraw() {
        return !status.isTerminal() && status != ApplicationStatus.WITHDRAWN;
    }

    /**
     * 检查是否需要缴费
     */
    public boolean needsPayment() {
        return status == ApplicationStatus.APPROVED;
    }

    /**
     * 检查是否可以发放准考证
     */
    public boolean canIssueTicket() {
        return status == ApplicationStatus.PAID ||
               (status == ApplicationStatus.APPROVED); // 免费考试
    }

    // Getters
    public ApplicationId getId() { return id; }
    public ExamId getExamId() { return examId; }
    public PositionId getPositionId() { return positionId; }
    public CandidateId getCandidateId() { return candidateId; }
    public Integer getFormVersion() { return formVersion; }
    public String getPayload() { return payload; }
    public ApplicationStatus getStatus() { return status; }
    public String getAutoCheckResult() { return autoCheckResult; }
    public String getFinalDecision() { return finalDecision; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public LocalDateTime getStatusUpdatedAt() { return statusUpdatedAt; }
    public Long getVersion() { return version; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Application that = (Application) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Application{" +
                "id=" + id +
                ", examId=" + examId +
                ", positionId=" + positionId +
                ", candidateId=" + candidateId +
                ", status=" + status +
                '}';
    }

    /**
     * 申请创建异常
     */
    public static class ApplicationCreationException extends DomainException {
        public ApplicationCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }

    /**
     * 申请操作异常
     */
    public static class ApplicationOperationException extends DomainException {
        public ApplicationOperationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
}
