package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.domain.application.*;
import java.time.LocalDateTime;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.application.port.ApplicationFileAttachmentPort;
import com.duanruo.exam.application.port.NotificationPort;
import com.duanruo.exam.application.port.TenantContextPort;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.tenant.UserTenantRole;
import com.duanruo.exam.domain.tenant.UserTenantRoleRepository;
import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.domain.rule.*;
import com.duanruo.exam.domain.file.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationApplicationService {

    private final ApplicationRepository applicationRepository;
    private static final Logger log = LoggerFactory.getLogger(ApplicationApplicationService.class);

    private final ApplicationAuditLogRepository auditLogRepository;
    private final ApplicationFileAttachmentPort fileAttachmentPort;
    private final NotificationPort notificationPort;

    private final com.duanruo.exam.domain.exam.ExamRepository examRepository;
    private final com.duanruo.exam.domain.exam.PositionRepository positionRepository;

    private final ReviewApplicationService reviewService;
    private final RuleEngine ruleEngine;
    private final AttachmentValidationService attachmentValidationService;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final TenantContextPort tenantContextPort;

    @Autowired
    public ApplicationApplicationService(ApplicationRepository applicationRepository,
                                         ApplicationAuditLogRepository auditLogRepository,
                                         ApplicationFileAttachmentPort fileAttachmentPort,
                                         NotificationPort notificationPort,
                                         com.duanruo.exam.domain.exam.ExamRepository examRepository,
                                         com.duanruo.exam.domain.exam.PositionRepository positionRepository,
                                         ReviewApplicationService reviewService,
                                         RuleEngine ruleEngine,
                                         AttachmentValidationService attachmentValidationService,
                                         UserTenantRoleRepository userTenantRoleRepository,
                                         TenantContextPort tenantContextPort) {
        this.applicationRepository = applicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.fileAttachmentPort = fileAttachmentPort;
        this.notificationPort = notificationPort;
        this.examRepository = examRepository;
        this.positionRepository = positionRepository;
        this.reviewService = reviewService;
        this.ruleEngine = ruleEngine;
        this.attachmentValidationService = attachmentValidationService;
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.tenantContextPort = tenantContextPort;
    }

    // Backward-compatible constructor for tests
    public ApplicationApplicationService(ApplicationRepository applicationRepository,
                                         ApplicationAuditLogRepository auditLogRepository,
                                         ApplicationFileAttachmentPort fileAttachmentPort,
                                         NotificationPort notificationPort,
                                         com.duanruo.exam.domain.exam.ExamRepository examRepository) {
        this(applicationRepository, auditLogRepository, fileAttachmentPort, notificationPort, examRepository, null, null, null, null, null, null);
    }

    public ApplicationResponse submit(UUID candidateUserId, ApplicationSubmitRequest req) {
        // 报名窗口与状态强校验
        var examId = ExamId.of(req.examId());
        var exam = examRepository.findById(examId)
                .orElseThrow(() -> new com.duanruo.exam.shared.exception.ApplicationException("EXAM_NOT_FOUND", "考试不存在"));
        if (!exam.isRegistrationOpen()) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("INVALID_REGISTRATION_WINDOW", "考试未在报名开放期，禁止提交");
        }
        // 规则配置校验（必需字段/附件）
        Map<String, Object> rules = parseRulesConfig(exam.getRulesConfig());
        validateRequiredFieldsAndAttachments(rules, req.payload(), req.attachments());

        // 【改进】自动创建考生与租户的关联
        ensureCandidateTenantRole(candidateUserId);

        // 构建 domain 对象
        Application app = Application.create(
                examId,
                PositionId.of(req.positionId()),
                CandidateId.of(candidateUserId)
        );
        if (req.formVersion() != null) {
            // simple set via rebuild trick not available; keep version as default 1
        }
        // 将 payload 转为字符串（外层保证 JSON 序列化）
        String payloadJson = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .valueToTree(req.payload()).toString();
        app.updateFormData(payloadJson);
        app.submit();

        // 保存
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED,
                candidateUserId.toString(), "submit", null, LocalDateTime.now());
        // 通知：报名提交成功
        try {
            notificationPort.sendToUser(candidateUserId, "APPLICATION_SUBMITTED",
                    java.util.Map.of("applicationId", app.getId().getValue().toString()));
        } catch (Exception ex) {
            // Best-effort notification; log and continue
            log.warn("Failed to send APPLICATION_SUBMITTED notification for applicationId={} userId={}",
                    app.getId().getValue(), candidateUserId, ex);
        }

        // 关联附件
        if (req.attachments() != null && !req.attachments().isEmpty()) {
            for (ApplicationSubmitRequest.AttachmentRef a : req.attachments()) {
                if (a.fileId() == null) continue;
                fileAttachmentPort.associate(a.fileId(), app.getId().getValue(), a.fieldKey());
            }
        }

        // 自动审核：按规则配置驱动（无配置时回退MVP示例规则）
        ApplicationStatus target = autoReviewWithRules(req.payload(), rules);
        app.applyAutoReviewResult("CONFIG_AUTO_REVIEW", target);
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), ApplicationStatus.SUBMITTED, target,
                "SYSTEM", "auto-review", null, LocalDateTime.now());
        // 通知：自动审核结果
        try {
            notificationPort.sendToUser(app.getCandidateId().getValue(),
                    "AUTO_REVIEW_" + target.name(),
                    java.util.Map.of("applicationId", app.getId().getValue().toString(),
                                     "result", target.name()));
        } catch (Exception ex) {
            // Best-effort notification; ignore failures.
        }

        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    public ApplicationResponse saveDraft(UUID candidateUserId, ApplicationSubmitRequest req) {
        // 构建 DRAFT 申请
        Application app = Application.create(
                ExamId.of(req.examId()),
                PositionId.of(req.positionId()),
                CandidateId.of(candidateUserId)
        );
        // 可选：保存当前已填写的表单数据
        if (req.payload() != null && !req.payload().isEmpty()) {
            try {
                String payloadJson = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                        .valueToTree(req.payload()).toString();
                app.updateFormData(payloadJson);
            } catch (Exception ignored) {}
        }
        applicationRepository.save(app);
        // 关联附件（如有）
        if (req.attachments() != null && !req.attachments().isEmpty()) {
            for (ApplicationSubmitRequest.AttachmentRef a : req.attachments()) {
                if (a.fileId() == null) continue;
                fileAttachmentPort.associate(a.fileId(), app.getId().getValue(), a.fieldKey());
            }
        }
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    public ApplicationResponse updateDraft(UUID id, UUID candidateUserId, ApplicationSubmitRequest req) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        if (!app.getCandidateId().getValue().equals(candidateUserId)) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN", "只能修改自己的草稿");
        }
        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("CONFLICT_NOT_DRAFT", "仅草稿可修改");
        }
        if (req.payload() != null && !req.payload().isEmpty()) {
            try {
                String payloadJson = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                        .valueToTree(req.payload()).toString();
                app.updateFormData(payloadJson);
            } catch (Exception ignored) {}
        }
        applicationRepository.save(app);
        if (req.attachments() != null && !req.attachments().isEmpty()) {
            for (ApplicationSubmitRequest.AttachmentRef a : req.attachments()) {
                if (a.fileId() == null) continue;
                fileAttachmentPort.associate(a.fileId(), app.getId().getValue(), a.fieldKey());
            }
        }
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    public ApplicationResponse resubmit(UUID id, UUID candidateUserId, ApplicationSubmitRequest req) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        if (!app.getCandidateId().getValue().equals(candidateUserId)) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN", "只能重提自己的申请");
        }
        if (app.getStatus() != ApplicationStatus.RETURNED_FOR_RESUBMISSION) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("CONFLICT_NOT_RETURNED", "仅退回待重提状态可重提");
        }
        // 更新表单
        if (req.payload() != null && !req.payload().isEmpty()) {
            try {
                String payloadJson = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                        .valueToTree(req.payload()).toString();
                app.updateFormData(payloadJson);
            } catch (Exception ignored) {}
        }
        // 关联附件（如有）
        if (req.attachments() != null && !req.attachments().isEmpty()) {
            for (ApplicationSubmitRequest.AttachmentRef a : req.attachments()) {
                if (a.fileId() == null) continue;
                fileAttachmentPort.associate(a.fileId(), app.getId().getValue(), a.fieldKey());
            }
        }
        // 重提并进入 SUBMITTED
        app.resubmit();
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), ApplicationStatus.RETURNED_FOR_RESUBMISSION, ApplicationStatus.SUBMITTED,
                candidateUserId.toString(), "resubmit", null, LocalDateTime.now());
        // 自动审核
        var exam = examRepository.findById(app.getExamId()).orElse(null);
        Map<String, Object> rules = exam != null ? parseRulesConfig(exam.getRulesConfig()) : java.util.Map.of();
        Map<String, Object> payloadMap = parsePayload(app.getPayload());
        ApplicationStatus target = autoReviewWithRules(payloadMap, rules);
        app.applyAutoReviewResult("CONFIG_AUTO_REVIEW", target);
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), ApplicationStatus.SUBMITTED, target,
                "SYSTEM", "auto-review", null, LocalDateTime.now());
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }


    @Transactional(readOnly = true)
    public List<ApplicationResponse> listMy(UUID candidateUserId) {
        return applicationRepository.findByCandidate(CandidateId.of(candidateUserId))
                .stream()
                .map(a -> new ApplicationResponse(
                        a.getId().getValue(), a.getExamId().getValue(), a.getPositionId().getValue(),
                        a.getCandidateId().getValue(), a.getFormVersion(), a.getStatus().name(), a.getSubmittedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<com.duanruo.exam.application.dto.ApplicationListItemResponse> listMyEnriched(UUID candidateUserId) {
        var apps = applicationRepository.findByCandidate(CandidateId.of(candidateUserId));
        // collect unique IDs
        java.util.Set<java.util.UUID> examIds = new java.util.HashSet<>();
        java.util.Set<java.util.UUID> positionIds = new java.util.HashSet<>();
        for (var a : apps) { examIds.add(a.getExamId().getValue()); positionIds.add(a.getPositionId().getValue()); }
        // build maps for titles
        java.util.Map<java.util.UUID, String> examTitles = new java.util.HashMap<>();
        for (var id : examIds) {
            var e = examRepository.findById(com.duanruo.exam.domain.exam.ExamId.of(id)).orElse(null);
            if (e != null) examTitles.put(id, e.getTitle());
        }
        java.util.Map<java.util.UUID, String> positionTitles = new java.util.HashMap<>();
        for (var pid : positionIds) {
            var p = positionRepository.findById(com.duanruo.exam.domain.exam.PositionId.of(pid)).orElse(null);
            if (p != null) positionTitles.put(pid, p.getTitle());
        }
        // map to DTOs
        java.util.List<com.duanruo.exam.application.dto.ApplicationListItemResponse> list = new java.util.ArrayList<>();
        for (var a : apps) {
            list.add(new com.duanruo.exam.application.dto.ApplicationListItemResponse(
                    a.getId().getValue(), a.getExamId().getValue(), a.getPositionId().getValue(),
                    a.getCandidateId().getValue(), a.getFormVersion(), a.getStatus().name(), a.getSubmittedAt(),
                    examTitles.getOrDefault(a.getExamId().getValue(), null),
                    positionTitles.getOrDefault(a.getPositionId().getValue(), null)
            ));
        }
        return list;
    }

    @Transactional(readOnly = true)
    public java.util.List<com.duanruo.exam.application.dto.ApplicationListItemResponse> listByExamEnriched(
            UUID examId, String statusFilter, UUID positionIdFilter) {
        // 获取考试的所有报名
        var apps = applicationRepository.findByExam(ExamId.of(examId));

        // 按状态筛选
        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                ApplicationStatus status = ApplicationStatus.valueOf(statusFilter);
                apps = apps.stream()
                        .filter(a -> a.getStatus() == status)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // 忽略无效的状态值
            }
        }

        // 按岗位筛选
        if (positionIdFilter != null) {
            apps = apps.stream()
                    .filter(a -> a.getPositionId().getValue().equals(positionIdFilter))
                    .collect(Collectors.toList());
        }

        // 收集唯一的ID
        java.util.Set<java.util.UUID> positionIds = new java.util.HashSet<>();
        for (var a : apps) {
            positionIds.add(a.getPositionId().getValue());
        }

        // 构建岗位标题映射
        java.util.Map<java.util.UUID, String> positionTitles = new java.util.HashMap<>();
        for (var pid : positionIds) {
            var p = positionRepository.findById(com.duanruo.exam.domain.exam.PositionId.of(pid)).orElse(null);
            if (p != null) positionTitles.put(pid, p.getTitle());
        }

        // 获取考试标题
        var exam = examRepository.findById(ExamId.of(examId)).orElse(null);
        String examTitle = exam != null ? exam.getTitle() : null;

        // 映射到DTO
        java.util.List<com.duanruo.exam.application.dto.ApplicationListItemResponse> list = new java.util.ArrayList<>();
        for (var a : apps) {
            list.add(new com.duanruo.exam.application.dto.ApplicationListItemResponse(
                    a.getId().getValue(),
                    a.getExamId().getValue(),
                    a.getPositionId().getValue(),
                    a.getCandidateId().getValue(),
                    a.getFormVersion(),
                    a.getStatus().name(),
                    a.getSubmittedAt(),
                    examTitle,
                    positionTitles.getOrDefault(a.getPositionId().getValue(), null)
            ));
        }
        return list;
    }


    @Transactional(readOnly = true)
    public ApplicationResponse getById(UUID id) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    @Transactional(readOnly = true)
    public com.duanruo.exam.application.dto.ApplicationDetailResponse getDetailById(UUID id) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        java.util.Map<String, Object> payload = parsePayload(app.getPayload());
        java.util.Map<String, Object> autoCheck = parsePayload(app.getAutoCheckResult());
        java.util.Map<String, Object> finalDecision = parsePayload(app.getFinalDecision());
        return new com.duanruo.exam.application.dto.ApplicationDetailResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                payload,
                app.getStatus().name(),
                autoCheck,
                finalDecision,
                app.getSubmittedAt(),
                app.getStatusUpdatedAt(),
                app.getCreatedAt(),
                app.getUpdatedAt()
        );
    }

    public ApplicationResponse withdraw(UUID id, String actor) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        ApplicationStatus from = app.getStatus();
        app.withdraw();
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), from, app.getStatus(), actor, "withdraw", null, LocalDateTime.now());
        // 可选通知：撤销（保留为后续开启）
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    public ApplicationResponse markPaid(UUID id) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        // 仅允许已通过最终审核的申请支付
        if (app.getStatus() != ApplicationStatus.APPROVED) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("CONFLICT_NOT_APPROVED", "申请未最终审核通过，禁止支付");
        }
        ApplicationStatus from = app.getStatus();
        app.markAsPaid();
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), from, app.getStatus(), "SYSTEM", "pay-stub", null, LocalDateTime.now());
        // 通知：支付成功
        try {
            notificationPort.sendToUser(app.getCandidateId().getValue(),
                    "APPLICATION_PAID",
                    java.util.Map.of("applicationId", app.getId().getValue().toString()));
        } catch (Exception ex) {
            // Best-effort notification; ignore failures.
        }
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    public ApplicationResponse runAutoReview(UUID id) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        ApplicationStatus from = app.getStatus();
        // 仅允许在 SUBMITTED 状态进行自动审核，领域层有校验
        Map<String, Object> payloadMap = parsePayload(app.getPayload());
        var exam = examRepository.findById(app.getExamId()).orElse(null);
        Map<String, Object> rules = exam != null ? parseRulesConfig(exam.getRulesConfig()) : java.util.Map.of();
        ApplicationStatus target = autoReviewWithRules(payloadMap, rules);
        app.applyAutoReviewResult("MANUAL_AUTO_REVIEW", target);
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), from, app.getStatus(), "SYSTEM", "auto-review", null, LocalDateTime.now());
        // 通知：人工触发自动审核结果
        try {
            notificationPort.sendToUser(app.getCandidateId().getValue(),
                    "AUTO_REVIEW_" + app.getStatus().name(),
                    java.util.Map.of("applicationId", app.getId().getValue().toString(),
                                     "result", app.getStatus().name()));
        } catch (Exception ex) {
            // Best-effort notification; ignore failures.
        }
        return new ApplicationResponse(
                app.getId().getValue(),
                app.getExamId().getValue(),
                app.getPositionId().getValue(),
                app.getCandidateId().getValue(),
                app.getFormVersion(),
                app.getStatus().name(),
                app.getSubmittedAt()
        );
    }

    private Map<String, Object> parsePayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) return Map.of();
        try {
            var mapper = com.fasterxml.jackson.databind.json.JsonMapper.builder().build();
            return mapper.readValue(payloadJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // 无法解析时，按空负载处理
            return Map.of();
        }
    }

    private Map<String, Object> parseRulesConfig(String rulesJson) {
        if (rulesJson == null || rulesJson.isBlank()) return Map.of();
        try {
            var mapper = com.fasterxml.jackson.databind.json.JsonMapper.builder().build();
            return mapper.readValue(rulesJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private void validateRequiredFieldsAndAttachments(Map<String, Object> rules,
                                                      Map<String, Object> payload,
                                                      List<ApplicationSubmitRequest.AttachmentRef> attachments) {
        if (rules == null || rules.isEmpty()) return;

        List<String> missingFields = new java.util.ArrayList<>();

        // 1. 验证必填字段
        Object rf = rules.get("requiredFields");
        if (rf instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof String key) {
                    Object v = payload != null ? payload.get(key) : null;
                    if (v == null || (v instanceof String s && s.isBlank())) {
                        missingFields.add(key);
                    }
                }
            }
        }

        // 2. 验证必填附件（使用新的附件验证服务）
        List<AttachmentRequirement> requirements = parseAttachmentRequirements(rules);
        if (!requirements.isEmpty() && attachmentValidationService != null) {
            // 将附件列表转换为 Map<fieldKey, List<fileId>>
            Map<String, List<UUID>> attachmentMap = new HashMap<>();
            if (attachments != null) {
                for (var a : attachments) {
                    if (a.fieldKey() != null && a.fileId() != null) {
                        attachmentMap.computeIfAbsent(a.fieldKey(), k -> new ArrayList<>()).add(a.fileId());
                    }
                }
            }

            // 执行附件验证
            AttachmentValidationResult validationResult = attachmentValidationService.validate(attachmentMap, requirements);

            if (!validationResult.isValid()) {
                String attachmentErrors = validationResult.getErrorMessage();
                String msg = (missingFields.isEmpty() ? "" : ("缺少必需字段: " + String.join(",", missingFields)))
                        + (missingFields.isEmpty() || attachmentErrors.isEmpty() ? "" : "; ")
                        + attachmentErrors;
                throw new com.duanruo.exam.shared.exception.ApplicationException("RULE_VALIDATION_FAILED", msg);
            }
        }

        // 如果只有字段错误
        if (!missingFields.isEmpty()) {
            String msg = "缺少必需字段: " + String.join(",", missingFields);
            throw new com.duanruo.exam.shared.exception.ApplicationException("RULE_VALIDATION_FAILED", msg);
        }
    }

    /**
     * 从规则配置中解析附件要求
     */
    private List<AttachmentRequirement> parseAttachmentRequirements(Map<String, Object> rules) {
        List<AttachmentRequirement> requirements = new ArrayList<>();

        Object ra = rules.get("requiredAttachments");
        if (ra instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof String key) {
                    // 简单模式：只有fieldKey
                    requirements.add(AttachmentRequirement.builder()
                            .fieldKey(key)
                            .fieldLabel(key)
                            .required(true)
                            .build());
                } else if (o instanceof Map<?, ?> map) {
                    // 详细模式：包含完整配置
                    requirements.add(parseAttachmentRequirement(map));
                }
            }
        }

        return requirements;
    }

    /**
     * 解析单个附件要求
     */
    @SuppressWarnings("unchecked")
    private AttachmentRequirement parseAttachmentRequirement(Map<?, ?> map) {
        AttachmentRequirement.Builder builder = AttachmentRequirement.builder();

        if (map.get("fieldKey") instanceof String fieldKey) {
            builder.fieldKey(fieldKey);
        }
        if (map.get("fieldLabel") instanceof String fieldLabel) {
            builder.fieldLabel(fieldLabel);
        }
        if (map.get("required") instanceof Boolean required) {
            builder.required(required);
        }
        if (map.get("minFiles") instanceof Number minFiles) {
            builder.minFiles(minFiles.intValue());
        }
        if (map.get("maxFiles") instanceof Number maxFiles) {
            builder.maxFiles(maxFiles.intValue());
        }
        if (map.get("maxFileSize") instanceof Number maxFileSize) {
            builder.maxFileSize(maxFileSize.longValue());
        }
        if (map.get("allowedExtensions") instanceof List<?> extensions) {
            List<String> extList = new ArrayList<>();
            for (Object ext : extensions) {
                if (ext instanceof String) {
                    extList.add(((String) ext).toLowerCase());
                }
            }
            builder.allowedExtensions(extList);
        }
        if (map.get("category") instanceof String category) {
            builder.category(category);
        }

        return builder.build();
    }

    private ApplicationStatus autoReviewWithRules(Map<String, Object> payload, Map<String, Object> rules) {
        if (payload == null) return ApplicationStatus.PENDING_PRIMARY_REVIEW;

        // 如果配置了新的规则引擎格式，使用规则引擎
        if (rules != null && rules.containsKey("rules") && ruleEngine != null) {
            try {
                RuleContext context = RuleContext.builder()
                        .formData(payload)
                        .build();

                RuleExecutionResult result = ruleEngine.execute(rules, context);

                // 根据规则执行结果返回状态
                return switch (result.getAction()) {
                    case "PASS", "AUTO_PASS" -> ApplicationStatus.AUTO_PASSED;
                    case "REJECT", "AUTO_REJECT" -> ApplicationStatus.AUTO_REJECTED;
                    default -> ApplicationStatus.PENDING_PRIMARY_REVIEW;
                };
            } catch (Exception e) {
                log.warn("[AutoReview] 规则引擎执行失败，回退到简单规则: {}", e.getMessage());
                // 继续执行简单规则作为回退
            }
        }

        // 回退到简单规则（向后兼容）
        Map<String, Object> ar = java.util.Map.of();
        if (rules != null) {
            ar = toMapStringObject(rules.get("autoReview"));
        }
        // passIfEducationIn
        Object list = ar.get("passIfEducationIn");
        if (list instanceof List<?> l) {
            Object edu = payload.get("education");
            if (edu instanceof String s) {
                for (Object o : l) {
                    if (o instanceof String v && (s.contains(v) || s.equalsIgnoreCase(v))) {
                        return ApplicationStatus.AUTO_PASSED;
                    }
                }
            }
        }
        // rejectIfAgeBelow
        Object threshold = ar.get("rejectIfAgeBelow");
        if (threshold instanceof Number t) {
            Object age = payload.get("age");
            if (age instanceof Number n && n.intValue() < t.intValue()) {
                return ApplicationStatus.AUTO_REJECTED;
            }
        }
        // fallback
        return ApplicationStatus.PENDING_PRIMARY_REVIEW;
    }

    // ===== 批量与导入导出 =====
    @Transactional(readOnly = true)
    public String exportCsv(UUID examId, String statusFilter, String requestedBy) {
        var list = (examId != null) ? applicationRepository.findByExam(ExamId.of(examId)) : java.util.List.<Application>of();
        var sb = new StringBuilder();
        sb.append("id,examId,positionId,candidateId,status,submittedAt\n");
        var fmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (var a : list) {
            if (statusFilter != null && !statusFilter.isBlank()) {
                if (!a.getStatus().name().equalsIgnoreCase(statusFilter)) continue;
            }
            String ts = a.getSubmittedAt() != null ? a.getSubmittedAt().format(fmt) : "";
            sb.append(a.getId().getValue()).append(',')
              .append(a.getExamId().getValue()).append(',')
              .append(a.getPositionId().getValue()).append(',')
              .append(a.getCandidateId().getValue()).append(',')
              .append(a.getStatus().name()).append(',')
              .append(ts)
              .append('\n');
            // 审计：导出（逐条）
            try {
                auditLogRepository.record(a.getId(), a.getStatus(), a.getStatus(), requestedBy != null ? requestedBy : "SYSTEM",
                        "export", null, LocalDateTime.now());
            } catch (Exception ignore) {}
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateForImport(UUID candidateUserId, ApplicationSubmitRequest req) {
        var examId = ExamId.of(req.examId());
        var exam = examRepository.findById(examId)
                .orElseThrow(() -> new com.duanruo.exam.shared.exception.ApplicationException("EXAM_NOT_FOUND", "考试不存在"));
        if (!exam.isRegistrationOpen()) {
            return Map.of("valid", false, "error", "考试未在报名开放期");
        }
        Map<String, Object> rules = parseRulesConfig(exam.getRulesConfig());
        try {
            validateRequiredFieldsAndAttachments(rules, req.payload(), req.attachments());
        } catch (Exception e) {
            return Map.of("valid", false, "error", e.getMessage());
        }
        ApplicationStatus predicted = autoReviewWithRules(req.payload(), rules);
        return Map.of("valid", true, "predictedStatus", predicted.name());
    }

    public Map<String, Object> importApplications(boolean dryRun, java.util.List<ImportItem> items, String actor) {
        int success = 0; int failed = 0; java.util.List<Map<String,Object>> results = new java.util.ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            var it = items.get(i);
            try {
                var check = validateForImport(it.candidateId(), it.request());
                if (!(Boolean) check.getOrDefault("valid", false)) {
                    failed++; results.add(Map.of("index", i, "ok", false, "error", check.get("error"))); continue;
                }
                if (!dryRun) {
                    submit(it.candidateId(), it.request());
                    // 额外记录一次“bulk-import”
                    try {
                        var appOpt = applicationRepository.findByExamAndCandidate(ExamId.of(it.request().examId()), com.duanruo.exam.domain.candidate.CandidateId.of(it.candidateId()));
                        appOpt.ifPresent(app -> auditLogRepository.record(app.getId(), app.getStatus(), app.getStatus(), actor != null ? actor : "ADMIN", "bulk-import", null, LocalDateTime.now()));
                    } catch (Exception ignore) {}
                }
                success++; results.add(Map.of("index", i, "ok", true, "predictedStatus", check.get("predictedStatus")));
            } catch (Exception e) {
                failed++; results.add(Map.of("index", i, "ok", false, "error", e.getMessage()));
            }
        }
        return Map.of("dryRun", dryRun, "success", success, "failed", failed, "total", items.size(), "results", results);
    }

    public record ImportItem(UUID candidateId, ApplicationSubmitRequest request) {}

    public Map<String, Object> batchTransition(boolean dryRun, String targetStatus, java.util.List<UUID> ids, String actor) {
        ApplicationStatus target;
        try { target = ApplicationStatus.valueOf(targetStatus); } catch (Exception e) { throw new IllegalArgumentException("invalid targetStatus"); }
        int success=0, failed=0; java.util.List<Map<String,Object>> results = new java.util.ArrayList<>();
        for (UUID id : ids) {
            try {
                if (!dryRun) {
                    if (target == ApplicationStatus.WITHDRAWN) {
                        withdraw(id, actor != null ? actor : "ADMIN");
                    } else if (target == ApplicationStatus.PAID) {
                        markPaid(id);
                    } else {
                        if (reviewService == null) throw new IllegalStateException("Review service unavailable for batch transition");
                        reviewService.applyDecision(id, target, "bulk-transition");
                    }
                }
                success++; results.add(Map.of("id", id.toString(), "ok", true));
            } catch (Exception e) {
                failed++; results.add(Map.of("id", id.toString(), "ok", false, "error", e.getMessage()));
            }
        }
        return Map.of("dryRun", dryRun, "success", success, "failed", failed, "total", ids.size(), "targetStatus", target.name(), "results", results);
    }
    private java.util.Map<String,Object> toMapStringObject(Object obj) {
        if (obj instanceof java.util.Map<?,?> m) {
            java.util.Map<String,Object> res = new java.util.HashMap<>();
            for (var e : m.entrySet()) {
                res.put(String.valueOf(e.getKey()), e.getValue());
            }
            return res;
        }
        return java.util.Map.of();
    }

    /**
     * 删除草稿
     * 只能删除DRAFT状态的报名
     * 注意：关联的附件不会被删除，会成为孤儿文件，由定时任务清理
     */
    public void deleteDraft(UUID id, UUID candidateUserId) {
        Application app = applicationRepository.findById(ApplicationId.of(id))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));

        // 验证是否是该考生的报名
        if (!app.getCandidateId().getValue().equals(candidateUserId)) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("FORBIDDEN", "无权删除他人的报名");
        }

        // 只能删除草稿状态的报名
        if (app.getStatus() != ApplicationStatus.DRAFT) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("INVALID_STATUS", "只能删除草稿状态的报名");
        }

        // 删除报名（关联的附件会成为孤儿文件，由定时任务清理）
        applicationRepository.delete(app.getId());

        log.info("Draft application {} deleted by candidate {}", id, candidateUserId);
    }

    /**
     * 获取草稿列表
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> listDrafts(UUID candidateUserId) {
        return applicationRepository.findByCandidate(CandidateId.of(candidateUserId))
                .stream()
                .filter(app -> app.getStatus() == ApplicationStatus.DRAFT)
                .map(a -> new ApplicationResponse(
                        a.getId().getValue(),
                        a.getExamId().getValue(),
                        a.getPositionId().getValue(),
                        a.getCandidateId().getValue(),
                        a.getFormVersion(),
                        a.getStatus().name(),
                        a.getSubmittedAt()
                ))
                .collect(Collectors.toList());
    }

    /**
     * 批量导入报名
     * 管理员功能，用于批量导入考生报名信息
     */
    public ApplicationBatchImportResponse batchImport(ApplicationBatchImportRequest request, String importedBy) {
        ApplicationBatchImportResponse response = new ApplicationBatchImportResponse();
        response.setTotal(request.getItems().size());

        int successCount = 0;
        int failedCount = 0;

        // 验证考试存在且开放报名
        var exam = examRepository.findById(ExamId.of(request.getExamId()))
                .orElseThrow(() -> new com.duanruo.exam.shared.exception.ApplicationException("EXAM_NOT_FOUND", "考试不存在"));

        if (!exam.isRegistrationOpen()) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("INVALID_REGISTRATION_WINDOW", "考试未在报名开放期");
        }

        // 获取规则配置
        Map<String, Object> rules = parseRulesConfig(exam.getRulesConfig());

        // 逐条导入
        for (int i = 0; i < request.getItems().size(); i++) {
            ApplicationBatchImportRequest.ImportItem item = request.getItems().get(i);
            int rowNumber = i + 1;

            try {
                // 查找考生用户（这里简化处理，实际应该通过UserRepository查找）
                // 由于没有UserRepository的依赖，这里假设candidateUsername就是userId
                UUID candidateId;
                try {
                    candidateId = UUID.fromString(item.getCandidateUsername());
                } catch (IllegalArgumentException e) {
                    throw new com.duanruo.exam.shared.exception.ApplicationException(
                            "INVALID_CANDIDATE", "无效的考生ID: " + item.getCandidateUsername());
                }

                // 检查是否已经报名
                if (applicationRepository.existsByExamAndCandidate(
                        ExamId.of(request.getExamId()),
                        CandidateId.of(candidateId))) {
                    throw new com.duanruo.exam.shared.exception.ApplicationException(
                            "DUPLICATE_APPLICATION", "考生已报名该考试");
                }

                // 创建报名
                Application app = Application.create(
                        ExamId.of(request.getExamId()),
                        PositionId.of(item.getPositionId()),
                        CandidateId.of(candidateId)
                );

                // 设置表单数据
                if (item.getPayload() != null && !item.getPayload().isEmpty()) {
                    try {
                        String payloadJson = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                                .valueToTree(item.getPayload()).toString();
                        app.updateFormData(payloadJson);
                    } catch (Exception ignored) {}
                }

                // 提交并自动审核
                app.submit();
                ApplicationStatus target = autoReviewWithRules(item.getPayload(), rules);
                app.applyAutoReviewResult("BATCH_IMPORT_AUTO_REVIEW", target);

                applicationRepository.save(app);

                // 记录审计日志
                auditLogRepository.record(app.getId(), ApplicationStatus.SUBMITTED, target,
                        importedBy, "batch-import", null, LocalDateTime.now());

                response.getSuccessIds().add(app.getId().getValue());
                successCount++;

            } catch (Exception e) {
                failedCount++;
                response.getFailures().add(new ApplicationBatchImportResponse.FailureDetail(
                        rowNumber,
                        item.getCandidateUsername(),
                        e.getMessage()
                ));

                // 如果不跳过错误，则抛出异常回滚整个事务
                if (!Boolean.TRUE.equals(request.getSkipErrors())) {
                    throw new com.duanruo.exam.shared.exception.ApplicationException(
                            "BATCH_IMPORT_FAILED",
                            "批量导入失败，第" + rowNumber + "行: " + e.getMessage());
                }
            }
        }

        response.setSuccess(successCount);
        response.setFailed(failedCount);

        log.info("Batch import completed: total={}, success={}, failed={}",
                response.getTotal(), successCount, failedCount);

        return response;
    }

    /**
     * 确保考生在当前租户下拥有CANDIDATE角色
     * 如果考生首次报名该租户的考试，自动创建UserTenantRole关联
     *
     * 这样可以：
     * 1. 明确记录考生参加过哪些租户的考试
     * 2. 支持租户级别的考生管理
     * 3. 为将来的跨租户查询提供基础
     */
    private void ensureCandidateTenantRole(UUID candidateUserId) {
        try {
            // 获取当前租户ID（通过TenantContextPort）
            TenantId tenantId = tenantContextPort.getCurrentTenantId();
            if (tenantId == null) {
                log.warn("No tenant context found when ensuring candidate tenant role for user: {}", candidateUserId);
                return;
            }

            UserId userId = UserId.of(candidateUserId);

            // 检查用户是否已有该租户的CANDIDATE角色
            boolean hasRole = userTenantRoleRepository.hasRole(userId, tenantId, Role.CANDIDATE);

            if (!hasRole) {
                // 自动创建UserTenantRole关联
                UserTenantRole userTenantRole = UserTenantRole.create(
                    userId,
                    tenantId,
                    Role.CANDIDATE,
                    candidateUserId  // 考生自己授予自己CANDIDATE角色
                );

                userTenantRoleRepository.save(userTenantRole);

                log.info("Auto-created CANDIDATE role for user {} in tenant {}", candidateUserId, tenantId.getValue());
            } else {
                log.debug("User {} already has CANDIDATE role in tenant {}", candidateUserId, tenantId.getValue());
            }

        } catch (Exception e) {
            log.error("Failed to ensure candidate tenant role for user {}: {}", candidateUserId, e.getMessage(), e);
            // 不抛出异常，避免影响报名流程
        }
    }

}

