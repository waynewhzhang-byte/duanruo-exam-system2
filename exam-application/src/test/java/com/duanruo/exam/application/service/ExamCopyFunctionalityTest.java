package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ExamCopyRequest;
import com.duanruo.exam.application.dto.ExamResponse;
import com.duanruo.exam.application.service.ExamApplicationService.ExamCreationException;
import com.duanruo.exam.application.service.ExamApplicationService.ExamNotFoundException;
import com.duanruo.exam.domain.exam.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 考试复制功能测试
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("考试复制功能测试")
class ExamCopyFunctionalityTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @InjectMocks
    private ExamApplicationService examApplicationService;

    private Exam sourceExam;
    private ExamId sourceExamId;
    private Position sourcePosition;
    private Subject sourceSubject;

    @BeforeEach
    void setUp() {
        // 创建源考试
        sourceExamId = ExamId.of(UUID.randomUUID());
        LocalDateTime now = LocalDateTime.now();
        
        sourceExam = Exam.rebuild(
                sourceExamId,
                "EXAM2024",
                "exam-2024",
                "2024年度考试",
                "这是一个测试考试",
                "重要公告：请准时参加考试",
                now.minusDays(10),
                now.plusDays(10),
                now.plusDays(30),  // examStart
                now.plusDays(30).plusHours(3),  // examEnd
                true,
                new BigDecimal("100.00"),
                "准考证模板内容",
                null,  // formTemplate
                ExamStatus.OPEN,
                "admin",
                now.minusDays(20),
                now
        );
        
        // 设置规则配置
        sourceExam.updateRulesConfig("{\"autoReview\":true,\"rules\":[]}");

        // 创建源岗位
        sourcePosition = Position.rebuild(
                PositionId.of(UUID.randomUUID()),
                sourceExamId,
                "POS001",
                "软件开发工程师",
                "负责软件开发工作",
                "本科及以上学历",
                50,
                UUID.randomUUID().toString()
        );

        // 创建源科目
        sourceSubject = Subject.rebuild(
                SubjectId.of(UUID.randomUUID()),
                sourcePosition.getId(),
                "专业笔试",
                120,
                SubjectType.WRITTEN,
                new BigDecimal("100.00"),
                new BigDecimal("60.00"),
                new BigDecimal("0.7"),
                1,
                "{\"date\":\"2024-12-01\",\"time\":\"09:00\"}"
        );
    }

    @Test
    @DisplayName("复制考试 - 成功复制所有内容")
    void copyExam_shouldCopyAllContent_whenAllOptionsEnabled() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setNewSlug("exam-2025");
        request.setCopyPositions(true);
        request.setCopySubjects(true);
        request.setCopyAnnouncement(true);
        request.setCopyRulesConfig(true);
        request.setCopyFeeSettings(true);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);
        // slug字段已废弃，不再检查
        when(positionRepository.findByExamId(sourceExamId)).thenReturn(Arrays.asList(sourcePosition));
        when(subjectRepository.findByPositionId(sourcePosition.getId())).thenReturn(Arrays.asList(sourceSubject));

        // Act
        ExamResponse result = examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("EXAM2025");
        assertThat(result.getTitle()).isEqualTo("2025年度考试");

        // 验证考试保存
        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository, times(1)).save(examCaptor.capture());
        Exam savedExam = examCaptor.getValue();
        assertThat(savedExam.getCode()).isEqualTo("EXAM2025");
        assertThat(savedExam.getDescription()).isEqualTo(sourceExam.getDescription());
        assertThat(savedExam.getAnnouncement()).isEqualTo(sourceExam.getAnnouncement());
        assertThat(savedExam.isFeeRequired()).isTrue();
        assertThat(savedExam.getFeeAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(savedExam.getTicketTemplate()).isEqualTo(sourceExam.getTicketTemplate());
        assertThat(savedExam.getRulesConfig()).isEqualTo(sourceExam.getRulesConfig());

        // 验证岗位保存
        verify(positionRepository, times(1)).save(any(Position.class));

        // 验证科目保存
        verify(subjectRepository, times(1)).save(any(Subject.class));
    }

    @Test
    @DisplayName("复制考试 - 不复制公告")
    void copyExam_shouldNotCopyAnnouncement_whenCopyAnnouncementIsFalse() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyAnnouncement(false);
        request.setCopyPositions(false);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());
        Exam savedExam = examCaptor.getValue();
        assertThat(savedExam.getAnnouncement()).isNull();
    }

    @Test
    @DisplayName("复制考试 - 不复制费用设置")
    void copyExam_shouldNotCopyFeeSettings_whenCopyFeeSettingsIsFalse() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyFeeSettings(false);
        request.setCopyPositions(false);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());
        Exam savedExam = examCaptor.getValue();
        assertThat(savedExam.isFeeRequired()).isFalse();
    }

    @Test
    @DisplayName("复制考试 - 不复制规则配置")
    void copyExam_shouldNotCopyRulesConfig_whenCopyRulesConfigIsFalse() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyRulesConfig(false);
        request.setCopyPositions(false);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());
        Exam savedExam = examCaptor.getValue();
        assertThat(savedExam.getRulesConfig()).isNull();
    }

    @Test
    @DisplayName("复制考试 - 不复制岗位")
    void copyExam_shouldNotCopyPositions_whenCopyPositionsIsFalse() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyPositions(false);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        verify(examRepository).save(any(Exam.class));
        verify(positionRepository, never()).findByExamId(any());
        verify(positionRepository, never()).save(any());
    }

    @Test
    @DisplayName("复制考试 - 复制岗位但不复制科目")
    void copyExam_shouldCopyPositionsButNotSubjects_whenCopySubjectsIsFalse() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyPositions(true);
        request.setCopySubjects(false);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);
        when(positionRepository.findByExamId(sourceExamId)).thenReturn(Arrays.asList(sourcePosition));

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        verify(positionRepository).save(any(Position.class));
        verify(subjectRepository, never()).findByPositionId(any());
        verify(subjectRepository, never()).save(any());
    }

    @Test
    @DisplayName("复制考试 - 源考试不存在时抛出异常")
    void copyExam_shouldThrowException_whenSourceExamNotFound() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> examApplicationService.copyExam(sourceExamId, request, "admin"))
                .isInstanceOf(ExamNotFoundException.class)
                .hasMessageContaining("源考试不存在");
    }

    @Test
    @DisplayName("复制考试 - 新考试代码已存在时抛出异常")
    void copyExam_shouldThrowException_whenNewCodeAlreadyExists() {
        // Arrange
        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> examApplicationService.copyExam(sourceExamId, request, "admin"))
                .isInstanceOf(ExamCreationException.class)
                .hasMessageContaining("考试代码已存在");
    }

    // slug字段已废弃，删除此测试
    // @Test
    // @DisplayName("复制考试 - 新slug已存在时抛出异常")
    // void copyExam_shouldThrowException_whenNewSlugAlreadyExists() {
    //     // slug字段已废弃，不再检查
    // }

    @Test
    @DisplayName("复制考试 - 复制多个岗位和科目")
    void copyExam_shouldCopyMultiplePositionsAndSubjects() {
        // Arrange
        Position position2 = Position.rebuild(
                PositionId.of(UUID.randomUUID()),
                sourceExamId,
                "POS002",
                "测试工程师",
                "负责测试工作",
                "本科及以上学历",
                30,
                null
        );

        Subject subject2 = Subject.rebuild(
                SubjectId.of(UUID.randomUUID()),
                sourcePosition.getId(),
                "面试",
                60,
                SubjectType.INTERVIEW,
                new BigDecimal("100.00"),
                new BigDecimal("60.00"),
                new BigDecimal("0.3"),
                2,
                null
        );

        ExamCopyRequest request = new ExamCopyRequest();
        request.setNewCode("EXAM2025");
        request.setNewTitle("2025年度考试");
        request.setCopyPositions(true);
        request.setCopySubjects(true);

        when(examRepository.findById(sourceExamId)).thenReturn(Optional.of(sourceExam));
        when(examRepository.existsByCode("EXAM2025")).thenReturn(false);
        when(positionRepository.findByExamId(sourceExamId)).thenReturn(Arrays.asList(sourcePosition, position2));
        when(subjectRepository.findByPositionId(sourcePosition.getId())).thenReturn(Arrays.asList(sourceSubject, subject2));
        when(subjectRepository.findByPositionId(position2.getId())).thenReturn(Arrays.asList());

        // Act
        examApplicationService.copyExam(sourceExamId, request, "admin");

        // Assert
        verify(positionRepository, times(2)).save(any(Position.class));
        verify(subjectRepository, times(2)).save(any(Subject.class));
    }
}

