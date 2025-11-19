package com.duanruo.exam.domain.exam;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * 岗位实体单元测试
 */
class PositionTest {

    // ========== 创建岗位测试 ==========

    @Test
    void create_shouldCreatePosition_whenValidDataProvided() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        String code = "POS-001";
        String title = "软件工程师";

        // When
        Position position = Position.create(examId, code, title);

        // Then
        assertThat(position).isNotNull();
        assertThat(position.getId()).isNotNull();
        assertThat(position.getExamId()).isEqualTo(examId);
        assertThat(position.getCode()).isEqualTo(code);
        assertThat(position.getTitle()).isEqualTo(title);
        assertThat(position.getSubjects()).isEmpty();
    }

    @Test
    void create_shouldTrimCodeAndTitle_whenCreatingPosition() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());
        String code = "  POS-001  ";
        String title = "  软件工程师  ";

        // When
        Position position = Position.create(examId, code, title);

        // Then
        assertThat(position.getCode()).isEqualTo("POS-001");
        assertThat(position.getTitle()).isEqualTo("软件工程师");
    }

    @Test
    void create_shouldThrowException_whenExamIdIsNull() {
        // When & Then
        assertThatThrownBy(() -> Position.create(null, "POS-001", "软件工程师"))
                .isInstanceOf(Position.PositionCreationException.class)
                .hasMessageContaining("考试ID不能为空");
    }

    @Test
    void create_shouldThrowException_whenCodeIsNull() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Position.create(examId, null, "软件工程师"))
                .isInstanceOf(Position.PositionCreationException.class)
                .hasMessageContaining("岗位代码不能为空");
    }

    @Test
    void create_shouldThrowException_whenCodeIsEmpty() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Position.create(examId, "  ", "软件工程师"))
                .isInstanceOf(Position.PositionCreationException.class)
                .hasMessageContaining("岗位代码不能为空");
    }

    @Test
    void create_shouldThrowException_whenTitleIsNull() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Position.create(examId, "POS-001", null))
                .isInstanceOf(Position.PositionCreationException.class)
                .hasMessageContaining("岗位标题不能为空");
    }

    @Test
    void create_shouldThrowException_whenTitleIsEmpty() {
        // Given
        ExamId examId = ExamId.of(UUID.randomUUID());

        // When & Then
        assertThatThrownBy(() -> Position.create(examId, "POS-001", "  "))
                .isInstanceOf(Position.PositionCreationException.class)
                .hasMessageContaining("岗位标题不能为空");
    }

    // ========== 更新岗位信息测试 ==========

    @Test
    void updateInfo_shouldUpdateInfo_whenValidDataProvided() {
        // Given
        Position position = createPosition();
        String newTitle = "高级软件工程师";
        String description = "负责核心系统开发";
        String requirements = "本科及以上学历，3年以上工作经验";

        // When
        position.updateInfo(newTitle, description, requirements);

        // Then
        assertThat(position.getTitle()).isEqualTo(newTitle);
        assertThat(position.getDescription()).isEqualTo(description);
        assertThat(position.getRequirements()).isEqualTo(requirements);
    }

    @Test
    void updateInfo_shouldTrimValues_whenUpdatingInfo() {
        // Given
        Position position = createPosition();

        // When
        position.updateInfo("  高级软件工程师  ", "  负责核心系统开发  ", "  本科及以上  ");

        // Then
        assertThat(position.getTitle()).isEqualTo("高级软件工程师");
        assertThat(position.getDescription()).isEqualTo("负责核心系统开发");
        assertThat(position.getRequirements()).isEqualTo("本科及以上");
    }

    @Test
    void updateInfo_shouldKeepOriginalTitle_whenNewTitleIsNull() {
        // Given
        Position position = createPosition();
        String originalTitle = position.getTitle();

        // When
        position.updateInfo(null, "新描述", "新要求");

        // Then
        assertThat(position.getTitle()).isEqualTo(originalTitle);
        assertThat(position.getDescription()).isEqualTo("新描述");
        assertThat(position.getRequirements()).isEqualTo("新要求");
    }

    // ========== 配额管理测试 ==========

    @Test
    void setQuota_shouldSetQuota_whenValidQuotaProvided() {
        // Given
        Position position = createPosition();

        // When
        position.setQuota(10);

        // Then
        assertThat(position.getQuota()).isEqualTo(10);
        assertThat(position.hasQuotaLimit()).isTrue();
    }

    @Test
    void setQuota_shouldAllowNullQuota_whenNoLimit() {
        // Given
        Position position = createPosition();

        // When
        position.setQuota(null);

        // Then
        assertThat(position.getQuota()).isNull();
        assertThat(position.hasQuotaLimit()).isFalse();
    }

    @Test
    void setQuota_shouldThrowException_whenQuotaIsZero() {
        // Given
        Position position = createPosition();

        // When & Then
        assertThatThrownBy(() -> position.setQuota(0))
                .isInstanceOf(Position.PositionOperationException.class)
                .hasMessageContaining("招聘配额必须大于0");
    }

    @Test
    void setQuota_shouldThrowException_whenQuotaIsNegative() {
        // Given
        Position position = createPosition();

        // When & Then
        assertThatThrownBy(() -> position.setQuota(-1))
                .isInstanceOf(Position.PositionOperationException.class)
                .hasMessageContaining("招聘配额必须大于0");
    }

    @Test
    void hasAvailableQuota_shouldReturnTrue_whenNoQuotaLimit() {
        // Given
        Position position = createPosition();
        position.setQuota(null);

        // When & Then
        assertThat(position.hasAvailableQuota(100)).isTrue();
    }

    @Test
    void hasAvailableQuota_shouldReturnTrue_whenCurrentCountLessThanQuota() {
        // Given
        Position position = createPosition();
        position.setQuota(10);

        // When & Then
        assertThat(position.hasAvailableQuota(5)).isTrue();
    }

    @Test
    void hasAvailableQuota_shouldReturnFalse_whenCurrentCountEqualsQuota() {
        // Given
        Position position = createPosition();
        position.setQuota(10);

        // When & Then
        assertThat(position.hasAvailableQuota(10)).isFalse();
    }

    @Test
    void hasAvailableQuota_shouldReturnFalse_whenCurrentCountExceedsQuota() {
        // Given
        Position position = createPosition();
        position.setQuota(10);

        // When & Then
        assertThat(position.hasAvailableQuota(15)).isFalse();
    }

    // ========== 科目管理测试 ==========

    @Test
    void addSubject_shouldAddSubject_whenValidSubjectProvided() {
        // Given
        Position position = createPosition();
        Subject subject = createSubject("行政能力测试");

        // When
        position.addSubject(subject);

        // Then
        assertThat(position.getSubjects()).hasSize(1);
        assertThat(position.getSubjects()).contains(subject);
    }

    @Test
    void addSubject_shouldThrowException_whenSubjectIsNull() {
        // Given
        Position position = createPosition();

        // When & Then
        assertThatThrownBy(() -> position.addSubject(null))
                .isInstanceOf(Position.PositionOperationException.class)
                .hasMessageContaining("科目不能为空");
    }

    @Test
    void removeSubject_shouldRemoveSubject_whenSubjectExists() {
        // Given
        Position position = createPosition();
        Subject subject = createSubject("行政能力测试");
        position.addSubject(subject);

        // When
        position.removeSubject(subject.getId());

        // Then
        assertThat(position.getSubjects()).isEmpty();
    }

    @Test
    void removeSubject_shouldThrowException_whenSubjectIdIsNull() {
        // Given
        Position position = createPosition();

        // When & Then
        assertThatThrownBy(() -> position.removeSubject(null))
                .isInstanceOf(Position.PositionOperationException.class)
                .hasMessageContaining("科目ID不能为空");
    }

    // ========== 表单模板测试 ==========

    // ========== 座位规则测试 ==========

    @Test
    void setSeatRuleId_shouldSetRuleId_whenValidIdProvided() {
        // Given
        Position position = createPosition();
        String ruleId = "RULE-001";

        // When
        position.setSeatRuleId(ruleId);

        // Then
        assertThat(position.getSeatRuleId()).isEqualTo(ruleId);
    }

    // ========== 辅助方法 ==========

    private Position createPosition() {
        return Position.create(
                ExamId.of(UUID.randomUUID()),
                "POS-001",
                "软件工程师"
        );
    }

    private Subject createSubject(String name) {
        return Subject.create(
                PositionId.newPositionId(),
                name,
                120, // 120分钟
                SubjectType.WRITTEN
        );
    }
}

