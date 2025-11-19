package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.BatchReviewRequest;
import com.duanruo.exam.application.dto.BatchReviewResponse;
import com.duanruo.exam.application.port.NotificationPort;
import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.exam.ExamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReviewApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationAuditLogRepository auditLogRepository;
    private final ExamRepository examRepository;
    private final TicketApplicationService ticketService;
    private final NotificationPort notificationPort;

    public ReviewApplicationService(ApplicationRepository applicationRepository,
                                    ApplicationAuditLogRepository auditLogRepository,
                                    ExamRepository examRepository,
                                    TicketApplicationService ticketService,
                                    NotificationPort notificationPort) {
        this.applicationRepository = applicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.examRepository = examRepository;
        this.ticketService = ticketService;
        this.notificationPort = notificationPort;
    }

    public ApplicationStatus applyDecision(UUID applicationId, ApplicationStatus newStatus, String decision) {
        Application app = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("application not found"));
        ApplicationStatus from = app.getStatus();
        app.applyReviewDecision(newStatus, decision);
        applicationRepository.save(app);
        auditLogRepository.record(app.getId(), from, app.getStatus(), "REVIEWER", "review-decision", null, LocalDateTime.now());

        // 免费考试自动发证：当最终状态为 APPROVED 且考试不需要缴费时，自动标记为已支付并发证
        if (newStatus == ApplicationStatus.APPROVED) {
            var exam = examRepository.findById(app.getExamId()).orElse(null);
            if (exam != null && !exam.isFeeRequired()) {
                // 自动标记支付
                ApplicationStatus from2 = app.getStatus();
                app.markAsPaid();
                applicationRepository.save(app);
                auditLogRepository.record(app.getId(), from2, app.getStatus(), "SYSTEM", "auto-pay-free-exam", null, LocalDateTime.now());
                try {
                    notificationPort.sendToUser(app.getCandidateId().getValue(),
                            "APPLICATION_PAID_AUTO",
                            java.util.Map.of("applicationId", app.getId().getValue().toString()));
                } catch (Exception ignore) {
                    // Best-effort notification; do not block auto issuance on notification failures.
                }
                // 自动发证
                ticketService.generate(applicationId);
            }
        }
        return applicationRepository.findById(ApplicationId.of(applicationId)).map(Application::getStatus).orElse(app.getStatus());
    }

    /**
     * 批量审核报名
     * @param request 批量审核请求
     * @param reviewerId 审核员ID
     * @param stage 审核阶段（PRIMARY或SECONDARY）
     * @return 批量审核响应
     */
    public BatchReviewResponse batchReview(BatchReviewRequest request, UUID reviewerId, String stage) {
        BatchReviewResponse response = new BatchReviewResponse();
        response.setTotal(request.getApplicationIds().size());

        int successCount = 0;
        int failedCount = 0;

        for (UUID applicationId : request.getApplicationIds()) {
            try {
                // 查找报名
                Application app = applicationRepository.findById(ApplicationId.of(applicationId))
                        .orElseThrow(() -> new IllegalArgumentException("application not found: " + applicationId));

                // 确定目标状态
                ApplicationStatus from = app.getStatus();
                ApplicationStatus to;

                if ("PRIMARY".equals(stage)) {
                    to = request.getApprove() ? ApplicationStatus.PRIMARY_PASSED : ApplicationStatus.PRIMARY_REJECTED;
                } else if ("SECONDARY".equals(stage)) {
                    to = request.getApprove() ? ApplicationStatus.APPROVED : ApplicationStatus.SECONDARY_REJECTED;
                } else {
                    throw new IllegalArgumentException("Invalid stage: " + stage);
                }

                // 应用审核决策
                app.applyReviewDecision(to, request.getReason());
                applicationRepository.save(app);

                // 记录审计日志
                auditLogRepository.record(app.getId(), from, to, reviewerId.toString(),
                        request.getReason(), null, LocalDateTime.now());

                // 免费考试自动发证
                if (to == ApplicationStatus.APPROVED) {
                    var exam = examRepository.findById(app.getExamId()).orElse(null);
                    if (exam != null && !exam.isFeeRequired()) {
                        ApplicationStatus from2 = app.getStatus();
                        app.markAsPaid();
                        applicationRepository.save(app);
                        auditLogRepository.record(app.getId(), from2, app.getStatus(), "SYSTEM",
                                "auto-pay-free-exam", null, LocalDateTime.now());

                        try {
                            notificationPort.sendToUser(app.getCandidateId().getValue(),
                                    "APPLICATION_PAID_AUTO",
                                    java.util.Map.of("applicationId", app.getId().getValue().toString()));
                        } catch (Exception ignore) {}

                        ticketService.generate(applicationId);
                    }
                }

                response.getSuccessIds().add(applicationId);
                successCount++;

            } catch (Exception e) {
                failedCount++;
                response.getFailures().add(new BatchReviewResponse.FailureDetail(
                        applicationId,
                        e.getMessage()
                ));
            }
        }

        response.setSuccess(successCount);
        response.setFailed(failedCount);

        return response;
    }
}

