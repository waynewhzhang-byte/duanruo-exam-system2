package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 考试应用服务
 * 实现考试管理的核心业务逻辑
 */
@Service
@Transactional
public class ExamApplicationService {

    private final ExamRepository examRepository;
    private final PositionRepository positionRepository;
    private final SubjectRepository subjectRepository;
    private final ApplicationRepository applicationRepository;

    public ExamApplicationService(ExamRepository examRepository,
                                 PositionRepository positionRepository,
                                 SubjectRepository subjectRepository,
                                 ApplicationRepository applicationRepository) {
        this.examRepository = examRepository;
        this.positionRepository = positionRepository;
        this.subjectRepository = subjectRepository;
        this.applicationRepository = applicationRepository;
    }

    /**
     * 获取所有考试
     */
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {
        List<Exam> exams = examRepository.findAll();
        return exams.stream()
                .map(this::toExamResponse)
                .toList();
    }

    /**
     * 根据ID获取考试
     */
    @Transactional(readOnly = true)
    public ExamResponse getExamById(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        return toExamResponse(exam);
    }

    /**
     * 根据slug获取考试（公开访问）
     */
    @Transactional(readOnly = true)
    public ExamResponse getExamBySlug(String slug) {
        // slug字段已废弃，使用code字段代替
        Exam exam = examRepository.findByCode(slug)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        return toExamResponse(exam);
    }

    /**
     * 创建考试
     */
    public ExamResponse createExam(ExamCreateRequest request, String createdBy) {
        // 检查考试代码是否已存在
        if (examRepository.existsByCode(request.getCode())) {
            throw new ExamCreationException("EXAM_CODE_EXISTS", "考试代码已存在");
        }

        // 创建考试（slug字段已废弃）
        Exam exam = Exam.create(
                request.getCode(),
                request.getTitle(),
                request.getDescription(),
                createdBy,
                request.getSlug()
        );

        // 设置公告
        if (request.getAnnouncement() != null) {
            exam.updateBasicInfo(exam.getTitle(), exam.getDescription(), request.getAnnouncement());
        }

        // 设置报名时间
        if (request.getRegistrationStart() != null && request.getRegistrationEnd() != null) {
            exam.setRegistrationPeriod(request.getRegistrationStart(), request.getRegistrationEnd());
        }

        // 设置考试举行时间
        if (request.getExamStart() != null || request.getExamEnd() != null) {
            exam.setExamSchedule(request.getExamStart(), request.getExamEnd());
        }

        // 设置费用
        if (request.getFeeRequired() != null) {
            exam.setFee(request.getFeeRequired(), request.getFeeAmount());
        }

        // 保存考试
        examRepository.save(exam);

        return toExamResponse(exam);
    }

    /**
     * 更新考试
     */
    public ExamResponse updateExam(ExamId examId, ExamUpdateRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        // 更新slug（slug字段已废弃，但保留setter以兼容旧代码）
        if (request.getSlug() != null) {
            exam.setSlug(request.getSlug().trim().isEmpty() ? null : request.getSlug());
        }

        // 更新基本信息
        exam.updateBasicInfo(
                request.getTitle(),
                request.getDescription(),
                request.getAnnouncement()
        );

        // 更新报名时间
        if (request.getRegistrationStart() != null && request.getRegistrationEnd() != null) {
            exam.setRegistrationPeriod(request.getRegistrationStart(), request.getRegistrationEnd());
        }

        // 更新考试举行时间
        if (request.getExamStart() != null || request.getExamEnd() != null) {
            exam.setExamSchedule(request.getExamStart(), request.getExamEnd());
        }

        // 更新费用
        if (request.getFeeRequired() != null) {
            exam.setFee(request.getFeeRequired(), request.getFeeAmount());
        }

        examRepository.save(exam);

        return toExamResponse(exam);
    }

    /**
     * 删除考试
     */
    public void deleteExam(ExamId examId) {
        if (!examRepository.findById(examId).isPresent()) {
            throw new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在");
        }

        examRepository.delete(examId);
    }

    /**
     * 开放考试报名
     */
    public ExamResponse openExam(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        exam.open();
        examRepository.save(exam);

        return toExamResponse(exam);
    }

    /**
     * 关闭考试报名
     */
    public ExamResponse closeExam(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        exam.close();
        examRepository.save(exam);

        return toExamResponse(exam);
    }

    /**
     * 开始考试
     */
    public ExamResponse startExam(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        exam.startExam();
        examRepository.save(exam);

        return toExamResponse(exam);
    }

    /**
     * 完成考试
     */
    public ExamResponse completeExam(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        exam.complete();
        examRepository.save(exam);

        return toExamResponse(exam);
    }

    @Transactional(readOnly = true)
    public String getAnnouncement(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        return exam.getAnnouncement();
    }

    public String updateAnnouncement(ExamId examId, String announcement) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        exam.updateBasicInfo(exam.getTitle(), exam.getDescription(), announcement);
        examRepository.save(exam);
        return exam.getAnnouncement();
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getRules(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        String json = exam.getRulesConfig();
        if (json == null || json.isBlank()) return java.util.Map.of();
        try {
            var mapper = com.fasterxml.jackson.databind.json.JsonMapper.builder().build();
            return mapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>(){});
        } catch (Exception e) {
            return java.util.Map.of();
        }
    }

    public java.util.Map<String, Object> updateRules(ExamId examId, java.util.Map<String, Object> rules) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        try {
            var mapper = com.fasterxml.jackson.databind.json.JsonMapper.builder().build();
            String json = mapper.writeValueAsString(rules == null ? java.util.Map.of() : rules);
            exam.updateRulesConfig(json);
            examRepository.save(exam);
            return rules == null ? java.util.Map.of() : rules;
        } catch (Exception e) {
            throw new ExamCreationException("INVALID_RULES_CONFIG", "规则配置不是有效的JSON");
        }
    }


    /**
     * 获取考试的岗位列表
     */
    @Transactional(readOnly = true)
    public List<PositionResponse> getExamPositions(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        return exam.getPositions().stream()
                .map(this::toPositionResponse)
                .toList();
    }

    /**
     * 通过slug获取考试岗位列表（公开访问）
     */
    @Transactional(readOnly = true)
    public List<PositionResponse> getExamPositionsBySlug(String slug) {
        // slug字段已废弃，使用code字段代替
        Exam exam = examRepository.findByCode(slug)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        return exam.getPositions().stream()
                .map(this::toPositionResponse)
                .toList();
    }

    /**
     * 通过slug获取考试公告（公开访问）
     */
    @Transactional(readOnly = true)
    public String getAnnouncementBySlug(String slug) {
        // slug字段已废弃，使用code字段代替
        Exam exam = examRepository.findByCode(slug)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));
        return exam.getAnnouncement();
    }

    /**
     * 获取开放报名的考试列表（公开访问）
     * 注意：此方法会跨所有租户查询，返回所有公开考试
     */
    @Transactional(readOnly = true)
    public List<ExamResponse> getOpenExams() {
        List<Exam> exams = examRepository.findByStatusAcrossAllTenants(ExamStatus.OPEN);
        return exams.stream()
                .map(this::toExamResponse)
                .toList();
    }

    /**
     * 转换为考试响应DTO
     */
    private ExamResponse toExamResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId().toString())
                .code(exam.getCode())
                .slug(exam.getSlug())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .announcement(exam.getAnnouncement())
                .registrationStart(exam.getRegistrationStart())
                .registrationEnd(exam.getRegistrationEnd())
                .examStart(exam.getExamStart())
                .examEnd(exam.getExamEnd())
                .feeRequired(exam.isFeeRequired())
                .feeAmount(exam.getFeeAmount())
                .status(exam.getStatus().getValue())
                .createdBy(exam.getCreatedBy())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }

    /**
     * 转换为岗位响应DTO
     */
    private PositionResponse toPositionResponse(Position position) {
        return PositionResponse.builder()
                .id(position.getId().toString())
                .examId(position.getExamId().toString())
                .code(position.getCode())
                .title(position.getTitle())
                .description(position.getDescription())
                .requirements(position.getRequirements())
                .quota(position.getQuota())
                .build();
    }

    /**
     * 考试未找到异常
     */
    public static class ExamNotFoundException extends ApplicationException {
        public ExamNotFoundException(String errorCode, String message) {
            super(errorCode, message);
        }
    }

    /**
     * 考试创建异常
     */
    public static class ExamCreationException extends ApplicationException {
        public ExamCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }

    /**
     * 获取考试统计信息
     */
    @Transactional(readOnly = true)
    public ExamStatisticsResponse getExamStatistics(ExamId examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "考试不存在"));

        ExamStatisticsResponse response = new ExamStatisticsResponse(
                exam.getId().toString(),
                exam.getCode(),
                exam.getTitle()
        );

        // 获取所有报名申请
        List<com.duanruo.exam.domain.application.Application> applications =
                applicationRepository.findByExam(examId);

        // 统计各状态的申请数量
        Map<ApplicationStatus, Long> statusCounts = applications.stream()
                .collect(Collectors.groupingBy(
                        com.duanruo.exam.domain.application.Application::getStatus,
                        Collectors.counting()
                ));

        response.setTotalApplications((long) applications.size());
        response.setDraftApplications(statusCounts.getOrDefault(ApplicationStatus.DRAFT, 0L));
        response.setSubmittedApplications(statusCounts.getOrDefault(ApplicationStatus.SUBMITTED, 0L));
        response.setPendingPrimaryReviewApplications(statusCounts.getOrDefault(ApplicationStatus.PENDING_PRIMARY_REVIEW, 0L));
        response.setPrimaryPassedApplications(statusCounts.getOrDefault(ApplicationStatus.PRIMARY_PASSED, 0L));
        response.setPrimaryRejectedApplications(statusCounts.getOrDefault(ApplicationStatus.PRIMARY_REJECTED, 0L));
        response.setPendingSecondaryReviewApplications(statusCounts.getOrDefault(ApplicationStatus.PENDING_SECONDARY_REVIEW, 0L));
        response.setApprovedApplications(statusCounts.getOrDefault(ApplicationStatus.APPROVED, 0L));
        response.setSecondaryRejectedApplications(statusCounts.getOrDefault(ApplicationStatus.SECONDARY_REJECTED, 0L));
        response.setPaidApplications(statusCounts.getOrDefault(ApplicationStatus.PAID, 0L));
        response.setTicketIssuedApplications(statusCounts.getOrDefault(ApplicationStatus.TICKET_ISSUED, 0L));

        // 计算审核通过率
        long primaryReviewed = response.getPrimaryPassedApplications() + response.getPrimaryRejectedApplications();
        if (primaryReviewed > 0) {
            response.setPrimaryApprovalRate((double) response.getPrimaryPassedApplications() / primaryReviewed * 100);
        } else {
            response.setPrimaryApprovalRate(0.0);
        }

        long secondaryReviewed = response.getApprovedApplications() + response.getSecondaryRejectedApplications();
        if (secondaryReviewed > 0) {
            response.setSecondaryApprovalRate((double) response.getApprovedApplications() / secondaryReviewed * 100);
        } else {
            response.setSecondaryApprovalRate(0.0);
        }

        long totalReviewed = response.getApprovedApplications() +
                           response.getPrimaryRejectedApplications() +
                           response.getSecondaryRejectedApplications();
        if (totalReviewed > 0) {
            response.setOverallApprovalRate((double) response.getApprovedApplications() / totalReviewed * 100);
        } else {
            response.setOverallApprovalRate(0.0);
        }

        // 统计岗位报名情况
        List<Position> positions = positionRepository.findByExamId(examId);
        List<ExamStatisticsResponse.PositionStatistics> positionStats = new ArrayList<>();

        for (Position position : positions) {
            long applicationCount = applicationRepository.countByPosition(position.getId());
            long approvedCount = applications.stream()
                    .filter(app -> app.getPositionId().equals(position.getId()))
                    .filter(app -> app.getStatus() == ApplicationStatus.APPROVED ||
                                 app.getStatus() == ApplicationStatus.PAID ||
                                 app.getStatus() == ApplicationStatus.TICKET_ISSUED)
                    .count();

            positionStats.add(new ExamStatisticsResponse.PositionStatistics(
                    position.getId().toString(),
                    position.getCode(),
                    position.getTitle(),
                    position.getQuota(),
                    applicationCount,
                    approvedCount
            ));
        }
        response.setPositionStatistics(positionStats);

        // 按日期统计报名数量
        Map<String, Long> applicationsByDate = applications.stream()
                .collect(Collectors.groupingBy(
                        app -> app.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        Collectors.counting()
                ));
        response.setApplicationsByDate(applicationsByDate);

        return response;
    }

    /**
     * 复制考试
     */
    public ExamResponse copyExam(ExamId sourceExamId, ExamCopyRequest request, String createdBy) {
        // 获取源考试
        Exam sourceExam = examRepository.findById(sourceExamId)
                .orElseThrow(() -> new ExamNotFoundException("EXAM_NOT_FOUND", "源考试不存在"));

        // 检查新考试代码是否已存在
        if (examRepository.existsByCode(request.getNewCode())) {
            throw new ExamCreationException("EXAM_CODE_EXISTS", "考试代码已存在");
        }

        // 创建新考试（slug字段已废弃）
        Exam newExam = Exam.create(
                request.getNewCode(),
                request.getNewTitle(),
                "",  // 描述稍后设置
                createdBy,
                request.getNewSlug()
        );

        // 复制基本信息
        newExam.updateBasicInfo(
                request.getNewTitle(),
                sourceExam.getDescription(),
                request.getCopyAnnouncement() ? sourceExam.getAnnouncement() : null
        );

        // 复制费用设置
        if (request.getCopyFeeSettings() && sourceExam.isFeeRequired()) {
            newExam.setFee(true, sourceExam.getFeeAmount());
        }

        // 复制准考证模板
        if (sourceExam.getTicketTemplate() != null) {
            newExam.setTicketTemplate(sourceExam.getTicketTemplate());
        }

        // 复制规则配置
        if (request.getCopyRulesConfig() && sourceExam.getRulesConfig() != null) {
            newExam.updateRulesConfig(sourceExam.getRulesConfig());
        }

        // 保存新考试
        examRepository.save(newExam);

        // 复制岗位和科目
        if (request.getCopyPositions()) {
            List<Position> sourcePositions = positionRepository.findByExamId(sourceExamId);

            for (Position sourcePosition : sourcePositions) {
                // 创建新岗位
                Position newPosition = Position.create(
                        newExam.getId(),
                        sourcePosition.getCode(),
                        sourcePosition.getTitle()
                );

                // 更新岗位详细信息
                newPosition.updateInfo(
                        sourcePosition.getTitle(),
                        sourcePosition.getDescription(),
                        sourcePosition.getRequirements()
                );

                // 设置配额
                if (sourcePosition.getQuota() != null) {
                    newPosition.setQuota(sourcePosition.getQuota());
                }

                // 复制座位规则ID
                if (sourcePosition.getSeatRuleId() != null) {
                    newPosition.setSeatRuleId(sourcePosition.getSeatRuleId());
                }

                positionRepository.save(newPosition);

                // 复制科目
                if (request.getCopySubjects()) {
                    // 从数据库查询源岗位的科目
                    List<Subject> sourceSubjects = subjectRepository.findByPositionId(sourcePosition.getId());

                    for (Subject sourceSubject : sourceSubjects) {
                        Subject newSubject = Subject.create(
                                newPosition.getId(),
                                sourceSubject.getName(),
                                sourceSubject.getDurationMinutes(),
                                sourceSubject.getType()
                        );

                        // 复制评分设置
                        if (sourceSubject.getMaxScore() != null) {
                            newSubject.setMaxScore(sourceSubject.getMaxScore());
                        }
                        if (sourceSubject.getPassingScore() != null) {
                            newSubject.setPassingScore(sourceSubject.getPassingScore());
                        }
                        if (sourceSubject.getWeight() != null) {
                            newSubject.setWeight(sourceSubject.getWeight());
                        }
                        if (sourceSubject.getOrdering() != null) {
                            newSubject.setOrdering(sourceSubject.getOrdering());
                        }
                        if (sourceSubject.getSchedule() != null) {
                            newSubject.setSchedule(sourceSubject.getSchedule());
                        }

                        // 保存新科目
                        subjectRepository.save(newSubject);
                    }
                }
            }
        }

        return toExamResponse(newExam);
    }

    /**
     * 获取考试的报名表单模板
     */
    @Transactional(readOnly = true)
    public String getFormTemplate(UUID examId) {
        Exam exam = examRepository.findById(ExamId.of(examId))
                .orElseThrow(() -> new ApplicationException("EXAM_NOT_FOUND", "考试不存在"));
        return exam.getFormTemplate();
    }

    /**
     * 更新考试的报名表单模板
     */
    public void updateFormTemplate(UUID examId, String templateJson) {
        // 基本合法性校验（JSON 格式）
        if (templateJson != null && !templateJson.isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                objectMapper.readTree(templateJson);
            } catch (Exception e) {
                throw new ApplicationException("INVALID_FORM_TEMPLATE", "表单模板必须是合法的 JSON 字符串");
            }
        }

        Exam exam = examRepository.findById(ExamId.of(examId))
                .orElseThrow(() -> new ApplicationException("EXAM_NOT_FOUND", "考试不存在"));

        // ⭐ 关键检查：如果考试已有报名提交，禁止修改表单配置
        if (applicationRepository.hasSubmittedApplicationsForExam(exam.getId())) {
            throw new ApplicationException("FORM_TEMPLATE_LOCKED",
                "该考试已有报名提交，无法修改表单配置");
        }

        exam.setFormTemplate(templateJson);
        examRepository.save(exam);
    }
}

