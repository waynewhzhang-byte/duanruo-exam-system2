package com.duanruo.exam.domain.exam;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * 考试聚合根单元测试
 */
class ExamTest {

    // ========== 创建考试测试 ==========

    @Test
    void create_shouldCreateExam_whenValidDataProvided() {
        // Given
        String code = "EXAM-2025-001";
        String title = "2025年公务员考试";
        String description = "国家公务员招录考试";
        String createdBy = "admin";

        // When
        Exam exam = Exam.create(code, title, description, createdBy);

        // Then
        assertThat(exam).isNotNull();
        assertThat(exam.getId()).isNotNull();
        assertThat(exam.getCode()).isEqualTo(code);
        assertThat(exam.getTitle()).isEqualTo(title);
        assertThat(exam.getDescription()).isEqualTo(description);
        assertThat(exam.getStatus()).isEqualTo(ExamStatus.DRAFT);
        assertThat(exam.getCreatedBy()).isEqualTo(createdBy);
        assertThat(exam.getCreatedAt()).isNotNull();
        assertThat(exam.getUpdatedAt()).isNotNull();
        assertThat(exam.isFeeRequired()).isFalse();
    }

    @Test
    void create_shouldGenerateSlug_whenSlugNotProvided() {
        // Given
        String code = "EXAM-2025-001";

        // When
        Exam exam = Exam.create(code, "Title", "Description", "admin");

        // Then
        assertThat(exam.getSlug()).isNotNull();
        assertThat(exam.getSlug()).isNotEmpty();
    }

    @Test
    void create_shouldUseProvidedSlug_whenSlugProvided() {
        // Given
        String code = "EXAM-2025-001";
        String slug = "custom-slug";

        // When
        Exam exam = Exam.create(code, "Title", "Description", "admin", slug);

        // Then
        assertThat(exam.getSlug()).isEqualTo(slug);
    }

    @Test
    void create_shouldThrowException_whenCodeIsNull() {
        // When & Then
        assertThatThrownBy(() -> Exam.create(null, "Title", "Description", "admin"))
                .isInstanceOf(Exam.ExamCreationException.class)
                .hasMessageContaining("考试代码不能为空");
    }

    @Test
    void create_shouldThrowException_whenCodeIsEmpty() {
        // When & Then
        assertThatThrownBy(() -> Exam.create("", "Title", "Description", "admin"))
                .isInstanceOf(Exam.ExamCreationException.class)
                .hasMessageContaining("考试代码不能为空");
    }

    @Test
    void create_shouldThrowException_whenTitleIsNull() {
        // When & Then
        assertThatThrownBy(() -> Exam.create("CODE", null, "Description", "admin"))
                .isInstanceOf(Exam.ExamCreationException.class)
                .hasMessageContaining("考试标题不能为空");
    }

    @Test
    void create_shouldThrowException_whenTitleIsEmpty() {
        // When & Then
        assertThatThrownBy(() -> Exam.create("CODE", "", "Description", "admin"))
                .isInstanceOf(Exam.ExamCreationException.class)
                .hasMessageContaining("考试标题不能为空");
    }

    @Test
    void create_shouldThrowException_whenCreatedByIsNull() {
        // When & Then
        assertThatThrownBy(() -> Exam.create("CODE", "Title", "Description", null))
                .isInstanceOf(Exam.ExamCreationException.class)
                .hasMessageContaining("创建者不能为空");
    }

    // ========== 更新基本信息测试 ==========

    @Test
    void updateBasicInfo_shouldUpdateInfo_whenExamIsDraft() {
        // Given
        Exam exam = Exam.create("CODE", "Old Title", "Old Description", "admin");
        String newTitle = "New Title";
        String newDescription = "New Description";
        String newAnnouncement = "New Announcement";

        // When
        exam.updateBasicInfo(newTitle, newDescription, newAnnouncement);

        // Then
        assertThat(exam.getTitle()).isEqualTo(newTitle);
        assertThat(exam.getDescription()).isEqualTo(newDescription);
        assertThat(exam.getAnnouncement()).isEqualTo(newAnnouncement);
    }

    @Test
    void updateBasicInfo_shouldThrowException_whenExamIsClosed() {
        // Given
        Exam exam = createOpenExam();
        exam.close();

        // When & Then
        assertThatThrownBy(() -> exam.updateBasicInfo("New Title", "New Description", "New Announcement"))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("已关闭的考试不能修改");
    }

    // ========== 设置报名时间测试 ==========

    @Test
    void setRegistrationPeriod_shouldSetPeriod_whenValidDatesProvided() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(30);

        // When
        exam.setRegistrationPeriod(start, end);

        // Then
        assertThat(exam.getRegistrationStart()).isEqualTo(start);
        assertThat(exam.getRegistrationEnd()).isEqualTo(end);
    }

    @Test
    void setRegistrationPeriod_shouldThrowException_whenStartIsNull() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        LocalDateTime end = LocalDateTime.now().plusDays(30);

        // When & Then
        assertThatThrownBy(() -> exam.setRegistrationPeriod(null, end))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("报名开始和结束时间不能为空");
    }

    @Test
    void setRegistrationPeriod_shouldThrowException_whenEndIsNull() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        LocalDateTime start = LocalDateTime.now().plusDays(1);

        // When & Then
        assertThatThrownBy(() -> exam.setRegistrationPeriod(start, null))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("报名开始和结束时间不能为空");
    }

    @Test
    void setRegistrationPeriod_shouldThrowException_whenStartIsAfterEnd() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        LocalDateTime start = LocalDateTime.now().plusDays(30);
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        // When & Then
        assertThatThrownBy(() -> exam.setRegistrationPeriod(start, end))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("报名开始时间不能晚于结束时间");
    }

    // ========== 设置费用测试 ==========

    @Test
    void setFee_shouldSetFee_whenRequiredAndAmountValid() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        BigDecimal amount = new BigDecimal("100.00");

        // When
        exam.setFee(true, amount);

        // Then
        assertThat(exam.isFeeRequired()).isTrue();
        assertThat(exam.getFeeAmount()).isEqualTo(amount);
    }

    @Test
    void setFee_shouldSetFree_whenNotRequired() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");

        // When
        exam.setFee(false, null);

        // Then
        assertThat(exam.isFeeRequired()).isFalse();
        assertThat(exam.getFeeAmount()).isNull();
    }

    @Test
    void setFee_shouldThrowException_whenRequiredButAmountIsNull() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");

        // When & Then
        assertThatThrownBy(() -> exam.setFee(true, null))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("收费考试的费用必须大于0");
    }

    @Test
    void setFee_shouldThrowException_whenRequiredButAmountIsZero() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");

        // When & Then
        assertThatThrownBy(() -> exam.setFee(true, BigDecimal.ZERO))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("收费考试的费用必须大于0");
    }

    @Test
    void setFee_shouldThrowException_whenRequiredButAmountIsNegative() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");

        // When & Then
        assertThatThrownBy(() -> exam.setFee(true, new BigDecimal("-10")))
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("收费考试的费用必须大于0");
    }

    // ========== 状态转换测试 ==========

    @Test
    void open_shouldOpenExam_whenExamIsDraftAndHasPositions() {
        // Given
        Exam exam = createDraftExamWithPosition();

        // When
        exam.open();

        // Then
        assertThat(exam.getStatus()).isEqualTo(ExamStatus.OPEN);
    }

    @Test
    void open_shouldThrowException_whenExamIsNotDraft() {
        // Given
        Exam exam = createOpenExam();

        // When & Then
        assertThatThrownBy(() -> exam.open())
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("只有草稿状态的考试才能开放");
    }

    @Test
    void open_shouldThrowException_whenRegistrationPeriodNotSet() {
        // Given
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");

        // When & Then
        assertThatThrownBy(() -> exam.open())
                .isInstanceOf(Exam.ExamOperationException.class)
                .hasMessageContaining("必须先设置报名时间");
    }

    // ========== 辅助方法 ==========

    private Exam createDraftExamWithPosition() {
        Exam exam = Exam.create("CODE", "Title", "Description", "admin");
        exam.setRegistrationPeriod(
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(30)
        );
        // 添加一个岗位
        Position position = Position.create(
                exam.getId(),
                "POS-001",
                "测试岗位"
        );
        exam.addPosition(position);
        return exam;
    }

    private Exam createOpenExam() {
        Exam exam = createDraftExamWithPosition();
        exam.open();
        return exam;
    }
}

