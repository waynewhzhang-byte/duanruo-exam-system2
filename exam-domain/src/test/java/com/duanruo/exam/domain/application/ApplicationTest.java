package com.duanruo.exam.domain.application;

import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * 报名申请聚合根单元测试
 */
class ApplicationTest {

    // ========== 创建报名测试 ==========

    @Test
    void create_shouldCreateApplication_whenValidDataProvided() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());
        CandidateId candidateId = CandidateId.of(UUID.randomUUID());

        // When
        Application application = Application.create(examId, positionId, candidateId);

        // Then
        assertThat(application).isNotNull();
        assertThat(application.getId()).isNotNull();
        assertThat(application.getExamId()).isEqualTo(examId);
        assertThat(application.getPositionId()).isEqualTo(positionId);
        assertThat(application.getCandidateId()).isEqualTo(candidateId);
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.DRAFT);
        assertThat(application.getFormVersion()).isEqualTo(1);
        assertThat(application.getVersion()).isEqualTo(0L);
        assertThat(application.getCreatedAt()).isNotNull();
        assertThat(application.getUpdatedAt()).isNotNull();
    }

    @Test
    void create_shouldThrowException_whenExamIdIsNull() {
        // Given
        PositionId positionId = PositionId.of(UUID.randomUUID());
        CandidateId candidateId = CandidateId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Application.create(null, positionId, candidateId))
                .isInstanceOf(Application.ApplicationCreationException.class)
                .hasMessageContaining("考试ID不能为空");
    }

    @Test
    void create_shouldThrowException_whenPositionIdIsNull() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        CandidateId candidateId = CandidateId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Application.create(examId, null, candidateId))
                .isInstanceOf(Application.ApplicationCreationException.class)
                .hasMessageContaining("岗位ID不能为空");
    }

    @Test
    void create_shouldThrowException_whenCandidateIdIsNull() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId positionId = PositionId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Application.create(examId, positionId, null))
                .isInstanceOf(Application.ApplicationCreationException.class)
                .hasMessageContaining("候选人ID不能为空");
    }

    // ========== 更新表单数据测试 ==========

    @Test
    void updateFormData_shouldUpdatePayload_whenApplicationIsDraft() {
        // Given
        Application application = createDraftApplication();
        String payload = "{\"name\":\"张三\",\"age\":25}";

        // When
        application.updateFormData(payload);

        // Then
        assertThat(application.getPayload()).isEqualTo(payload);
    }

    @Test
    void updateFormData_shouldThrowException_whenApplicationIsSubmitted() {
        // Given
        Application application = createSubmittedApplication();
        String payload = "{\"name\":\"张三\",\"age\":25}";

        // When & Then
        assertThatThrownBy(() -> application.updateFormData(payload))
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("仅草稿或被退回待重提的申请可以修改");
    }

    @Test
    void updateFormData_shouldThrowException_whenPayloadIsNull() {
        // Given
        Application application = createDraftApplication();

        // When & Then
        assertThatThrownBy(() -> application.updateFormData(null))
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("表单数据不能为空");
    }

    @Test
    void updateFormData_shouldThrowException_whenPayloadIsEmpty() {
        // Given
        Application application = createDraftApplication();

        // When & Then
        assertThatThrownBy(() -> application.updateFormData(""))
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("表单数据不能为空");
    }

    // ========== 提交申请测试 ==========

    @Test
    void submit_shouldSubmitApplication_whenApplicationIsDraftAndHasPayload() {
        // Given
        Application application = createDraftApplication();
        application.updateFormData("{\"name\":\"张三\"}");

        // When
        application.submit();

        // Then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);
        assertThat(application.getSubmittedAt()).isNotNull();
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    @Test
    void submit_shouldThrowException_whenApplicationIsNotDraft() {
        // Given
        Application application = createSubmittedApplication();

        // When & Then
        assertThatThrownBy(() -> application.submit())
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("只有草稿状态的申请才能提交");
    }

    @Test
    void submit_shouldThrowException_whenPayloadIsNull() {
        // Given
        Application application = createDraftApplication();

        // When & Then
        assertThatThrownBy(() -> application.submit())
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("必须先填写表单数据");
    }

    // ========== 撤销申请测试 ==========

    @Test
    void withdraw_shouldWithdrawApplication_whenApplicationIsNotTerminal() {
        // Given
        Application application = createSubmittedApplication();

        // When
        application.withdraw();

        // Then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.WITHDRAWN);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    @Test
    void withdraw_shouldThrowException_whenApplicationIsAlreadyWithdrawn() {
        // Given
        Application application = createSubmittedApplication();
        application.withdraw();

        // When & Then
        assertThatThrownBy(() -> application.withdraw())
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("已完成的申请不能撤销");
    }

    // ========== 自动审核测试 ==========

    @Test
    void applyAutoReviewResult_shouldApplyResult_whenApplicationIsSubmitted() {
        // Given
        Application application = createSubmittedApplication();
        String result = "{\"passed\":true}";
        ApplicationStatus newStatus = ApplicationStatus.PENDING_PRIMARY_REVIEW;

        // When
        application.applyAutoReviewResult(result, newStatus);

        // Then
        assertThat(application.getAutoCheckResult()).isEqualTo(result);
        assertThat(application.getStatus()).isEqualTo(newStatus);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    @Test
    void applyAutoReviewResult_shouldThrowException_whenApplicationIsNotSubmitted() {
        // Given
        Application application = createDraftApplication();
        String result = "{\"passed\":true}";
        ApplicationStatus newStatus = ApplicationStatus.PENDING_PRIMARY_REVIEW;

        // When & Then
        assertThatThrownBy(() -> application.applyAutoReviewResult(result, newStatus))
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("只有已提交的申请才能进行自动审核");
    }

    // ========== 审核决定测试 ==========

    @Test
    void applyReviewDecision_shouldApplyDecision_whenValidTransition() {
        // Given
        Application application = createUnderReviewApplication();
        String decision = "{\"approved\":true,\"comments\":\"符合要求\"}";
        ApplicationStatus newStatus = ApplicationStatus.PRIMARY_PASSED;

        // When
        application.applyReviewDecision(newStatus, decision);

        // Then
        assertThat(application.getFinalDecision()).isEqualTo(decision);
        assertThat(application.getStatus()).isEqualTo(newStatus);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    // ========== 缴费测试 ==========

    @Test
    void markAsPaid_shouldMarkAsPaid_whenApplicationIsApproved() {
        // Given
        Application application = createApprovedApplication();

        // When
        application.markAsPaid();

        // Then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.PAID);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    @Test
    void markAsPaid_shouldThrowException_whenApplicationIsNotApproved() {
        // Given
        Application application = createSubmittedApplication();

        // When & Then
        assertThatThrownBy(() -> application.markAsPaid())
                .isInstanceOf(Application.ApplicationOperationException.class)
                .hasMessageContaining("只有已通过审核的申请才能缴费");
    }

    // ========== 准考证发放测试 ==========

    @Test
    void markAsTicketIssued_shouldMarkAsTicketIssued_whenApplicationIsPaid() {
        // Given
        Application application = createPaidApplication();

        // When
        application.markAsTicketIssued();

        // Then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.TICKET_ISSUED);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    @Test
    void markAsTicketIssued_shouldMarkAsTicketIssued_whenApplicationIsApprovedAndFreeExam() {
        // Given
        Application application = createApprovedApplication();

        // When
        application.markAsTicketIssued();

        // Then
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.TICKET_ISSUED);
        assertThat(application.getStatusUpdatedAt()).isNotNull();
    }

    // ========== 辅助方法 ==========

    private Application createDraftApplication() {
        return Application.create(
                ExamId.of(UUID.randomUUID()),
                PositionId.of(UUID.randomUUID()),
                CandidateId.of(UUID.randomUUID())
        );
    }

    private Application createSubmittedApplication() {
        Application application = createDraftApplication();
        application.updateFormData("{\"name\":\"张三\"}");
        application.submit();
        return application;
    }

    private Application createUnderReviewApplication() {
        Application application = createSubmittedApplication();
        application.applyAutoReviewResult("{\"passed\":true}", ApplicationStatus.PENDING_PRIMARY_REVIEW);
        return application;
    }

    private Application createApprovedApplication() {
        Application application = createUnderReviewApplication();
        // 一级审核通过
        application.applyReviewDecision(ApplicationStatus.PRIMARY_PASSED, "{\"primary_approved\":true}");
        // 直接转换到最终通过（跳过二级审核）
        application.applyReviewDecision(ApplicationStatus.APPROVED, "{\"approved\":true}");
        return application;
    }

    private Application createPaidApplication() {
        Application application = createApprovedApplication();
        application.markAsPaid();
        return application;
    }
}

