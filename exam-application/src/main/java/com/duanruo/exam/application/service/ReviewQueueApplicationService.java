package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.review.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ReviewQueueApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ReviewQueueApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final ApplicationAuditLogRepository auditLogRepository;
    private final ReviewTaskRepository reviewTaskRepository;
    private final ExamReviewerRepository examReviewerRepository;
    private final ReviewRepository reviewRepository;

    private final Duration lockTtl;
    private final ObjectMapper mapper = new ObjectMapper();

    // Spring will use this constructor; tests can still use the 3-arg constructor below
    @org.springframework.beans.factory.annotation.Autowired
    public ReviewQueueApplicationService(ApplicationRepository applicationRepository,
                                         ApplicationAuditLogRepository auditLogRepository,
                                         ReviewTaskRepository reviewTaskRepository,
                                         ExamReviewerRepository examReviewerRepository,
                                         ReviewRepository reviewRepository,
                                         @Value("${review.lock-ttl-minutes:10}") long lockTtlMinutes) {
        this.applicationRepository = applicationRepository;
        this.auditLogRepository = auditLogRepository;
        this.reviewTaskRepository = reviewTaskRepository;
        this.examReviewerRepository = examReviewerRepository;
        this.reviewRepository = reviewRepository;
        this.lockTtl = Duration.ofMinutes(lockTtlMinutes);
    }

    // Backward-compatible constructor for tests
    public ReviewQueueApplicationService(ApplicationRepository applicationRepository,
                                         ApplicationAuditLogRepository auditLogRepository,
                                         ReviewTaskRepository reviewTaskRepository) {
        this(applicationRepository, auditLogRepository, reviewTaskRepository, null, null, 10L);
    }

    public PullResult pullNext(UUID examId, ReviewStage stage, UUID reviewerUserId) {
        return pullNext(examId, stage, reviewerUserId, null);
    }

    public PullResult pullNext(UUID examId, ReviewStage stage, UUID reviewerUserId, UUID preferredPositionId) {
        // 0) Duplicate-pull protection: if reviewer already holds an unexpired task in this stage, return it
        var mine = reviewTaskRepository.findAssignedTo(reviewerUserId).stream()
                .filter(t -> t.getStage() == stage)
                .filter(t -> !t.isLockExpired(lockTtl))
                .findFirst();
        if (mine.isPresent()) {
            var t = mine.get();
            return new PullResult(t.getId(), t.getApplicationId().getValue(), t.getStage(), LocalDateTime.now().plus(lockTtl));
        }

        // 1) 根据 stage 选择待处理状态
        List<Application> candidates = switch (stage) {
            case PRIMARY -> filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_PRIMARY_REVIEW), examId);
            case SECONDARY -> {
                List<Application> s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_SECONDARY_REVIEW), examId);
                if (s1.isEmpty()) s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PRIMARY_PASSED), examId);
                yield s1;
            }
        };
        if (candidates.isEmpty()) return PullResult.empty();

        // 1.1) 优先分桶：若指定 preferredPositionId，则将其优先排序
        List<Application> sorted = new ArrayList<>(candidates);
        if (preferredPositionId != null) {
            sorted.sort(Comparator
                    .comparing((Application a) -> !a.getPositionId().getValue().equals(preferredPositionId)) // false(匹配)优先
                    .thenComparing(a -> Optional.ofNullable(a.getSubmittedAt()).orElse(a.getStatusUpdatedAt())));
        } else {
            // 2) 选最早提交/更新的（稳定顺序）
            sorted.sort(Comparator.comparing(a -> Optional.ofNullable(a.getSubmittedAt()).orElse(a.getStatusUpdatedAt())));
        }
        for (Application app : sorted) {
            var existing = reviewTaskRepository.findActiveByApplicationAndStage(app.getId(), stage);
            if (existing.isPresent()) continue; // 正在被处理（未过期）
            ReviewTask task = ReviewTask.create(app.getId(), stage);
            task.assign(reviewerUserId);
            reviewTaskRepository.save(task);
            return new PullResult(task.getId(), app.getId().getValue(), stage, LocalDateTime.now().plus(lockTtl));
        }
        return PullResult.empty();
    }

    private List<Application> filterByExam(List<Application> list, UUID examId) {
        if (list == null) return List.of();
        return list.stream().filter(a -> a.getExamId().getValue().equals(examId)).toList();
    }

    public void heartbeat(UUID taskId, UUID reviewerUserId) {
        ReviewTask task = reviewTaskRepository.findById(taskId).orElseThrow();
        task.heartbeat(reviewerUserId);
        reviewTaskRepository.save(task);
    }

    public void release(UUID taskId, UUID reviewerUserId) {
        ReviewTask task = reviewTaskRepository.findById(taskId).orElseThrow();
        task.release(reviewerUserId);
        reviewTaskRepository.save(task);
    }

    public DecisionResult decide(UUID taskId, UUID reviewerUserId, boolean approve, String reason, List<UUID> evidenceFileIds) {
        ReviewTask task = reviewTaskRepository.findById(taskId).orElseThrow();
        Application app = applicationRepository.findById(task.getApplicationId()).orElseThrow();

        // 1) 应用状态流转
        ApplicationStatus from = app.getStatus();
        ApplicationStatus to;
        if (task.getStage() == ReviewStage.PRIMARY) {
            to = approve ? ApplicationStatus.PRIMARY_PASSED : ApplicationStatus.PRIMARY_REJECTED;
        } else {
            to = approve ? ApplicationStatus.APPROVED : ApplicationStatus.SECONDARY_REJECTED;
        }
        app.applyReviewDecision(to, reason);
        applicationRepository.save(app);

        // 2) 保存审核记录（不可变的审核历史）
        Review review = approve
            ? Review.approve(app.getId(), task.getStage(), reviewerUserId, reason)
            : Review.reject(app.getId(), task.getStage(), reviewerUserId, reason);
        reviewRepository.save(review);

        // 3) 审计日志（附证据列表）
        String metadata = null;
        try {
            Map<String, Object> meta = new HashMap<>();
            meta.put("stage", task.getStage().name());
            meta.put("approve", approve);
            meta.put("reviewId", review.getId().toString());
            meta.put("evidenceFileIds", evidenceFileIds == null ? List.of() : evidenceFileIds.stream().map(UUID::toString).toList());
            metadata = mapper.writeValueAsString(meta);
        } catch (Exception ignored) { /* keep metadata nullable if serialization fails */ }
        auditLogRepository.record(app.getId(), from, to, reviewerUserId.toString(), reason, metadata, LocalDateTime.now());

        // 4) 完成任务
        task.complete(reviewerUserId);
        reviewTaskRepository.save(task);

        return new DecisionResult(app.getId().getValue(), from, to);

    }

    public DecisionResult decide(UUID taskId, UUID reviewerUserId, String action, Boolean approve, String reason, List<UUID> evidenceFileIds) {
        // Backward compatibility: if action is null/blank, fallback to approve boolean path
        if (action == null || action.isBlank()) {
            return decide(taskId, reviewerUserId, approve != null && approve, reason, evidenceFileIds);
        }
        String act = action.trim().toUpperCase();
        ReviewTask task = reviewTaskRepository.findById(taskId).orElseThrow();
        Application app = applicationRepository.findById(task.getApplicationId()).orElseThrow();

        ApplicationStatus from = app.getStatus();
        ApplicationStatus to;
        switch (act) {
            case "APPROVE" -> to = (task.getStage() == ReviewStage.PRIMARY)
                    ? ApplicationStatus.PRIMARY_PASSED : ApplicationStatus.APPROVED;
            case "REJECT" -> to = (task.getStage() == ReviewStage.PRIMARY)
                    ? ApplicationStatus.PRIMARY_REJECTED : ApplicationStatus.SECONDARY_REJECTED;
            case "RETURN" -> to = ApplicationStatus.RETURNED_FOR_RESUBMISSION;
            default -> throw new IllegalArgumentException("Invalid action: " + action);
        }
        app.applyReviewDecision(to, reason);
        applicationRepository.save(app);

        // 保存审核记录
        Review review = switch (act) {
            case "APPROVE" -> Review.approve(app.getId(), task.getStage(), reviewerUserId, reason);
            case "REJECT" -> Review.reject(app.getId(), task.getStage(), reviewerUserId, reason);
            case "RETURN" -> Review.returnForRevision(app.getId(), task.getStage(), reviewerUserId, reason);
            default -> throw new IllegalArgumentException("Invalid action: " + action);
        };
        reviewRepository.save(review);

        String metadata = null;
        try {
            Map<String, Object> meta = new HashMap<>();
            meta.put("stage", task.getStage().name());
            meta.put("action", act);
            meta.put("approve", approve);
            meta.put("reviewId", review.getId().toString());
            meta.put("evidenceFileIds", evidenceFileIds == null ? List.of() : evidenceFileIds.stream().map(UUID::toString).toList());
            metadata = mapper.writeValueAsString(meta);
        } catch (Exception ignored) {}
        auditLogRepository.record(app.getId(), from, to, reviewerUserId.toString(), reason, metadata, LocalDateTime.now());

        task.complete(reviewerUserId);
        reviewTaskRepository.save(task);
        return new DecisionResult(app.getId().getValue(), from, to);
    }

    public AssigneeInfo getAssigneeInfo(UUID taskId) {
        ReviewTask t = reviewTaskRepository.findById(taskId).orElseThrow();
        return new AssigneeInfo(
                t.getId(), t.getStage(), t.getStatus(), t.getAssignedTo(), t.getLockedAt(), t.getLastHeartbeatAt()
        );
    }

    public QueuePage listQueue(UUID examId, ReviewStage stage, UUID positionId,
                                String statusFilter, int page, int size) {
        // Build candidate applications similar to pull logic
        List<Application> candidates = switch (stage) {
            case PRIMARY -> filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_PRIMARY_REVIEW), examId);
            case SECONDARY -> {
                List<Application> s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_SECONDARY_REVIEW), examId);
                if (s1.isEmpty()) s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PRIMARY_PASSED), examId);
                yield s1;
            }
        };
        if (positionId != null) {
            candidates = candidates.stream()
                    .filter(a -> a.getPositionId().getValue().equals(positionId))
                    .toList();
        }
        // Map to queue entries
        List<QueueEntry> entries = new ArrayList<>();
        for (Application app : candidates) {
            var existing = reviewTaskRepository.findActiveByApplicationAndStage(app.getId(), stage);
            if (existing.isPresent() && !existing.get().isLockExpired(lockTtl)) {
                ReviewTask t = existing.get();
                entries.add(new QueueEntry(
                        app.getId().getValue(), stage, t.getStatus().name(),
                        t.getId(), t.getAssignedTo(), t.getLockedAt(), t.getLastHeartbeatAt(),
                        Optional.ofNullable(app.getSubmittedAt()).orElse(app.getStatusUpdatedAt())
                ));
            } else {
                entries.add(new QueueEntry(
                        app.getId().getValue(), stage, ReviewTaskStatus.OPEN.name(),
                        null, null, null, null,
                        Optional.ofNullable(app.getSubmittedAt()).orElse(app.getStatusUpdatedAt())
                ));
            }
        }
        // Filter by status
        String f = statusFilter == null ? "ALL" : statusFilter.toUpperCase();
        if (!"ALL".equals(f)) {
            entries = entries.stream().filter(e -> e.status().equalsIgnoreCase(f)).toList();
        }
        // Sort: ASSIGNED first (in-progress), then OPEN; each by submittedAt asc
        entries = entries.stream().sorted(
                Comparator
                        .comparing((QueueEntry e) -> statusRank(e.status()))
                        .thenComparing(QueueEntry::submittedAt)
        ).toList();
        // Pagination
        int from = Math.max(0, page * size);
        int to = Math.min(entries.size(), from + size);
        List<QueueEntry> pageContent = from >= entries.size() ? List.of() : entries.subList(from, to);
        return new QueuePage(pageContent, entries.size(), page, size);
    }

    public record QueueEntry(UUID applicationId, ReviewStage stage, String status,
                             UUID taskId, UUID assignedTo, java.time.LocalDateTime lockedAt,
                             java.time.LocalDateTime lastHeartbeatAt, java.time.LocalDateTime submittedAt) {}
    public record QueuePage(List<QueueEntry> content, long totalElements, int page, int size) {}

    private int statusRank(String status) {
        return switch (status == null ? "" : status.toUpperCase()) {
            case "ASSIGNED" -> 0;
            case "OPEN" -> 1;
            default -> 2; // others if any
        };
    }

    /**
     * 自动分配任务（负载均衡）
     *
     * @param examId 考试ID
     * @param stage 审核阶段
     * @param batchSize 批量分配数量
     * @return 分配结果
     */
    public AutoAssignResult autoAssign(UUID examId, ReviewStage stage, int batchSize) {
        log.info("开始自动分配任务: examId={}, stage={}, batchSize={}", examId, stage, batchSize);

        // 1. 获取该考试该阶段的所有审核员
        if (examReviewerRepository == null) {
            log.warn("ExamReviewerRepository未注入，无法自动分配");
            return new AutoAssignResult(0, 0, Map.of());
        }

        List<UUID> reviewers = examReviewerRepository.findReviewerIdsByExam(examId, stage);
        if (reviewers.isEmpty()) {
            log.warn("未找到审核员: examId={}, stage={}", examId, stage);
            return new AutoAssignResult(0, 0, Map.of());
        }

        // 2. 获取待分配的申请
        List<Application> candidates = switch (stage) {
            case PRIMARY -> filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_PRIMARY_REVIEW), examId);
            case SECONDARY -> {
                List<Application> s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PENDING_SECONDARY_REVIEW), examId);
                if (s1.isEmpty()) s1 = filterByExam(applicationRepository.findByStatus(ApplicationStatus.PRIMARY_PASSED), examId);
                yield s1;
            }
        };

        // 3. 过滤掉已有任务的申请
        List<Application> unassigned = candidates.stream()
                .filter(app -> reviewTaskRepository.findActiveByApplicationAndStage(app.getId(), stage).isEmpty())
                .limit(batchSize)
                .toList();

        if (unassigned.isEmpty()) {
            log.info("没有待分配的任务");
            return new AutoAssignResult(0, 0, Map.of());
        }

        // 4. 计算每个审核员的当前负载
        Map<UUID, Long> workload = new HashMap<>();
        for (UUID reviewerId : reviewers) {
            long count = reviewTaskRepository.findAssignedTo(reviewerId).stream()
                    .filter(t -> t.getStage() == stage)
                    .filter(t -> !t.isLockExpired(lockTtl))
                    .count();
            workload.put(reviewerId, count);
        }

        // 5. 负载均衡分配
        Map<UUID, Integer> assignedCount = new HashMap<>();
        int totalAssigned = 0;

        for (Application app : unassigned) {
            // 找到负载最小的审核员
            UUID minLoadReviewer = reviewers.stream()
                    .min(Comparator.comparingLong(r -> workload.getOrDefault(r, 0L)))
                    .orElse(reviewers.get(0));

            // 创建并分配任务
            ReviewTask task = ReviewTask.create(app.getId(), stage);
            task.assign(minLoadReviewer);
            reviewTaskRepository.save(task);

            // 更新负载统计
            workload.put(minLoadReviewer, workload.getOrDefault(minLoadReviewer, 0L) + 1);
            assignedCount.put(minLoadReviewer, assignedCount.getOrDefault(minLoadReviewer, 0) + 1);
            totalAssigned++;

            log.debug("分配任务: applicationId={}, reviewerId={}", app.getId().getValue(), minLoadReviewer);
        }

        log.info("自动分配完成: 总数={}, 审核员数={}, 分配详情={}", totalAssigned, reviewers.size(), assignedCount);
        return new AutoAssignResult(totalAssigned, reviewers.size(), assignedCount);
    }

    /**
     * 批量审核
     *
     * @param taskIds 任务ID列表
     * @param reviewerUserId 审核员ID
     * @param approve 是否通过
     * @param reason 审核理由
     * @return 批量审核结果
     */
    public BatchDecisionResult batchDecide(List<UUID> taskIds, UUID reviewerUserId, boolean approve, String reason) {
        log.info("开始批量审核: taskIds={}, reviewerId={}, approve={}", taskIds.size(), reviewerUserId, approve);

        List<DecisionResult> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (UUID taskId : taskIds) {
            try {
                DecisionResult result = decide(taskId, reviewerUserId, approve, reason, null);
                results.add(result);
            } catch (Exception e) {
                log.error("批量审核失败: taskId={}, error={}", taskId, e.getMessage());
                errors.add("任务 " + taskId + ": " + e.getMessage());
            }
        }

        log.info("批量审核完成: 成功={}, 失败={}", results.size(), errors.size());
        return new BatchDecisionResult(results.size(), errors.size(), results, errors);
    }

    /**
     * 获取审核员工作台数据
     *
     * @param reviewerUserId 审核员ID
     * @param stage 审核阶段
     * @return 工作台数据
     */
    public WorkbenchData getWorkbench(UUID reviewerUserId, ReviewStage stage) {
        // 1. 我的待审核任务
        List<ReviewTask> myTasks = reviewTaskRepository.findAssignedTo(reviewerUserId).stream()
                .filter(t -> t.getStage() == stage)
                .filter(t -> !t.isLockExpired(lockTtl))
                .toList();

        // 2. 今日完成数
        LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);

        Set<ApplicationStatus> processedStatuses = EnumSet.of(
                ApplicationStatus.PRIMARY_PASSED,
                ApplicationStatus.PRIMARY_REJECTED,
                ApplicationStatus.SECONDARY_REJECTED,
                ApplicationStatus.APPROVED
        );

        long todayDone = auditLogRepository.countByActorAndToStatusInBetween(
                reviewerUserId.toString(), processedStatuses, startOfToday, endOfToday);

        // 3. 本周完成数
        LocalDateTime startOfWeek = LocalDateTime.now().toLocalDate()
                .with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long weekDone = auditLogRepository.countByActorAndToStatusInBetween(
                reviewerUserId.toString(), processedStatuses, startOfWeek, now);

        return new WorkbenchData(
                myTasks.size(),
                (int) todayDone,
                (int) weekDone,
                myTasks.stream()
                        .map(t -> new WorkbenchTask(
                                t.getId(),
                                t.getApplicationId().getValue(),
                                t.getStage(),
                                t.getStatus(),
                                t.getLockedAt(),
                                t.getLastHeartbeatAt()
                        ))
                        .toList()
        );
    }

    // DTOs
    public record PullResult(UUID taskId, UUID applicationId, ReviewStage stage, LocalDateTime lockedUntil) {
        public static PullResult empty() { return new PullResult(null, null, null, null); }
        public boolean isEmpty() { return taskId == null; }
    }
    public record DecisionResult(UUID applicationId, ApplicationStatus from, ApplicationStatus to) {}
    public record AssigneeInfo(UUID taskId, ReviewStage stage, ReviewTaskStatus status, UUID assignedTo,
                               LocalDateTime lockedAt, LocalDateTime lastHeartbeatAt) {}

    public record AutoAssignResult(int totalAssigned, int reviewerCount, Map<UUID, Integer> assignedPerReviewer) {}
    public record BatchDecisionResult(int successCount, int failureCount, List<DecisionResult> results, List<String> errors) {}
    public record WorkbenchData(int myPending, int todayDone, int weekDone, List<WorkbenchTask> tasks) {}
    public record WorkbenchTask(UUID taskId, UUID applicationId, ReviewStage stage, ReviewTaskStatus status,
                                LocalDateTime lockedAt, LocalDateTime lastHeartbeatAt) {}
}

