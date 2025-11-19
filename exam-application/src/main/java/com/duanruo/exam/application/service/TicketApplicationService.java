package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.ticket.*;
import com.duanruo.exam.application.port.NotificationPort;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.Position;
import com.duanruo.exam.domain.exam.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TicketApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAuditLogRepository auditLogRepository;
    private final NotificationPort notificationPort;
    private final ExamRepository examRepository;
    private final PositionRepository positionRepository;
    private final TicketNumberRuleApplicationService ruleService;
    private final TicketRepository ticketRepository;

    public TicketApplicationService(ApplicationRepository applicationRepository,
                                    ApplicationAuditLogRepository auditLogRepository,
                                    NotificationPort notificationPort,
                                    ExamRepository examRepository,
                                    PositionRepository positionRepository,
                                    TicketNumberRuleApplicationService ruleService,
                                    TicketRepository ticketRepository) {
        this.applicationRepository = applicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationPort = notificationPort;
        this.examRepository = examRepository;
        this.positionRepository = positionRepository;
        this.ruleService = ruleService;
        this.ticketRepository = ticketRepository;
    }

    /**
     * 生成准考证号（保留原有方法，向后兼容）
     */
    public TicketNo generate(UUID applicationId) {
        Application app = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        // 支付完成前禁止发证
        if (app.getStatus() != ApplicationStatus.PAID) {
            throw new com.duanruo.exam.shared.exception.ApplicationException("CONFLICT_NOT_PAID", "申请未完成支付，禁止发证");
        }
        ApplicationStatus from = app.getStatus();
        app.markAsTicketIssued();
        applicationRepository.save(app);
        // record audit log
        auditLogRepository.record(app.getId(), from, app.getStatus(), "SYSTEM", "ticket-generate", null, LocalDateTime.now());
        // notify: ticket issued
        try {
            notificationPort.sendToUser(app.getCandidateId().getValue(),
                    "TICKET_ISSUED",
                    java.util.Map.of("applicationId", app.getId().getValue().toString()));
        } catch (Exception ex) {
            // Best-effort notification; do not block ticket issuance on notification errors.
        }
        // generate ticket number using rule per exam
        var exam = examRepository.findById(app.getExamId()).orElseThrow();
        var position = positionRepository.findById(app.getPositionId()).orElseThrow();
        String num = ruleService.generateNumber(exam.getId().getValue(), exam.getCode(), position.getCode(), LocalDate.now());
        return TicketNo.of(num);
    }

    /**
     * 生成完整的准考证实体
     */
    public TicketResponse generateTicket(UUID applicationId) {
        // 检查是否已存在准考证
        var existingTicket = ticketRepository.findByApplicationId(ApplicationId.of(applicationId));
        if (existingTicket.isPresent()) {
            return toResponse(existingTicket.get());
        }

        // 获取报名信息
        Application app = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("报名不存在"));

        // 验证状态
        if (!app.canIssueTicket()) {
            throw new com.duanruo.exam.shared.exception.ApplicationException(
                    "INVALID_STATUS", "报名状态不允许发放准考证");
        }

        // 获取考试和岗位信息
        Exam exam = examRepository.findById(app.getExamId())
                .orElseThrow(() -> new IllegalArgumentException("考试不存在"));
        Position position = positionRepository.findById(app.getPositionId())
                .orElseThrow(() -> new IllegalArgumentException("岗位不存在"));

        // 生成准考证号
        String ticketNumber = ruleService.generateNumber(
                exam.getId().getValue(),
                exam.getCode(),
                position.getCode(),
                LocalDate.now());

        // 创建准考证实体
        // TODO: 从Candidate实体或payload中获取考生姓名和身份证号
        String candidateName = ""; // 暂时为空，需要从Candidate实体获取
        String candidateIdNumber = ""; // 暂时为空，需要从Candidate实体获取

        Ticket ticket = Ticket.create(
                app.getId(),
                app.getExamId(),
                app.getPositionId(),
                app.getCandidateId(),
                TicketNo.of(ticketNumber),
                candidateName,
                candidateIdNumber,
                exam.getTitle(),
                position.getTitle()
        );

        // 保存准考证
        ticketRepository.save(ticket);

        // 更新报名状态
        ApplicationStatus from = app.getStatus();
        app.markAsTicketIssued();
        applicationRepository.save(app);

        // 记录审计日志
        auditLogRepository.record(app.getId(), from, app.getStatus(),
                "SYSTEM", "ticket-generate", null, LocalDateTime.now());

        // 发送通知
        try {
            notificationPort.sendToUser(app.getCandidateId().getValue(),
                    "TICKET_ISSUED",
                    java.util.Map.of("applicationId", app.getId().getValue().toString(),
                            "ticketNo", ticketNumber));
        } catch (Exception ex) {
            // Best-effort notification
        }

        return toResponse(ticket);
    }

    /**
     * 获取准考证详情
     */
    public TicketResponse getTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(TicketId.of(ticketId))
                .orElseThrow(() -> new IllegalArgumentException("准考证不存在"));
        return toResponse(ticket);
    }

    /**
     * 根据报名ID获取准考证
     */
    public TicketResponse getTicketByApplicationId(UUID applicationId) {
        Ticket ticket = ticketRepository.findByApplicationId(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("准考证不存在"));
        return toResponse(ticket);
    }

    /**
     * 验证准考证
     */
    public TicketVerifyResponse verifyTicket(TicketVerifyRequest request) {
        TicketVerifyResponse response = new TicketVerifyResponse();

        // 查找准考证
        var ticketOpt = ticketRepository.findByTicketNo(TicketNo.of(request.getTicketNo()));
        if (ticketOpt.isEmpty()) {
            response.setValid(false);
            response.setMessage("准考证号不存在");
            return response;
        }

        Ticket ticket = ticketOpt.get();

        // 验证有效性
        if (!ticket.isValid()) {
            response.setValid(false);
            response.setMessage("准考证已取消");
            return response;
        }

        // 可选：验证身份证号
        if (request.getCandidateIdNumber() != null &&
            !request.getCandidateIdNumber().equals(ticket.getCandidateIdNumber())) {
            response.setValid(false);
            response.setMessage("身份证号不匹配");
            return response;
        }

        // 标记为已验证
        ticket.markAsVerified();
        ticketRepository.save(ticket);

        // 返回验证成功信息
        response.setValid(true);
        response.setMessage("验证成功");
        response.setTicketNo(ticket.getTicketNo().getValue());
        response.setCandidateName(ticket.getCandidateName());
        response.setExamTitle(ticket.getExamTitle());
        response.setPositionTitle(ticket.getPositionTitle());
        response.setVenueName(ticket.getVenueName());
        response.setRoomNumber(ticket.getRoomNumber());
        response.setSeatNumber(ticket.getSeatNumber());
        response.setExamStartTime(ticket.getExamStartTime());
        response.setExamEndTime(ticket.getExamEndTime());

        return response;
    }

    /**
     * 批量生成准考证
     */
    public BatchGenerateTicketsResponse batchGenerate(BatchGenerateTicketsRequest request) {
        BatchGenerateTicketsResponse response = new BatchGenerateTicketsResponse();
        List<BatchGenerateTicketsResponse.TicketResult> results = new ArrayList<>();

        // 获取需要生成准考证的报名列表
        List<Application> applications;
        if (request.getApplicationIds() != null && !request.getApplicationIds().isEmpty()) {
            // 指定报名ID列表
            applications = request.getApplicationIds().stream()
                    .map(id -> applicationRepository.findById(ApplicationId.of(id)).orElse(null))
                    .filter(app -> app != null)
                    .toList();
        } else {
            // 获取考试下所有符合条件的报名
            applications = applicationRepository.findByExam(ExamId.of(request.getExamId())).stream()
                    .filter(Application::canIssueTicket)
                    .toList();
        }

        response.setTotalCount(applications.size());
        int successCount = 0;
        int failureCount = 0;

        // 逐个生成准考证
        for (Application app : applications) {
            BatchGenerateTicketsResponse.TicketResult result = new BatchGenerateTicketsResponse.TicketResult();
            result.setApplicationId(app.getId().getValue());

            try {
                // 检查是否已存在
                var existing = ticketRepository.findByApplicationId(app.getId());
                if (existing.isPresent()) {
                    result.setSuccess(true);
                    result.setTicketNo(existing.get().getTicketNo().getValue());
                    successCount++;
                } else {
                    // 生成新准考证
                    TicketResponse ticketResp = generateTicket(app.getId().getValue());
                    result.setSuccess(true);
                    result.setTicketNo(ticketResp.getTicketNo());
                    successCount++;
                }
            } catch (Exception e) {
                result.setSuccess(false);
                result.setErrorMessage(e.getMessage());
                failureCount++;
            }

            results.add(result);
        }

        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        response.setResults(results);

        return response;
    }

    /**
     * 获取准考证统计信息
     */
    public TicketStatisticsResponse getStatistics(UUID examId) {
        TicketStatisticsResponse response = new TicketStatisticsResponse();
        response.setExamId(examId);

        ExamId examIdObj = ExamId.of(examId);
        response.setTotalCount(ticketRepository.countByExamId(examIdObj));
        response.setIssuedCount(ticketRepository.countByExamIdAndStatus(examIdObj, TicketStatus.ISSUED));
        response.setPrintedCount(ticketRepository.countByExamIdAndStatus(examIdObj, TicketStatus.PRINTED));
        response.setVerifiedCount(ticketRepository.countByExamIdAndStatus(examIdObj, TicketStatus.VERIFIED));
        response.setCancelledCount(ticketRepository.countByExamIdAndStatus(examIdObj, TicketStatus.CANCELLED));

        return response;
    }

    /**
     * 转换为响应DTO
     */
    private TicketResponse toResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId().getValue());
        response.setApplicationId(ticket.getApplicationId().getValue());
        response.setExamId(ticket.getExamId().getValue());
        response.setPositionId(ticket.getPositionId().getValue());
        response.setCandidateId(ticket.getCandidateId().getValue());
        response.setTicketNo(ticket.getTicketNo().getValue());
        response.setStatus(ticket.getStatus());

        response.setCandidateName(ticket.getCandidateName());
        response.setCandidateIdNumber(ticket.getCandidateIdNumber());
        response.setCandidatePhoto(ticket.getCandidatePhoto());

        response.setExamTitle(ticket.getExamTitle());
        response.setPositionTitle(ticket.getPositionTitle());
        response.setExamStartTime(ticket.getExamStartTime());
        response.setExamEndTime(ticket.getExamEndTime());

        response.setVenueName(ticket.getVenueName());
        response.setRoomNumber(ticket.getRoomNumber());
        response.setSeatNumber(ticket.getSeatNumber());

        response.setQrCode(ticket.getQrCode());
        response.setBarcode(ticket.getBarcode());

        response.setIssuedAt(ticket.getIssuedAt());
        response.setPrintedAt(ticket.getPrintedAt());
        response.setVerifiedAt(ticket.getVerifiedAt());
        response.setCancelledAt(ticket.getCancelledAt());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());

        return response;
    }
}

