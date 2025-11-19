package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.review.*;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ReviewStatsApplicationServiceTest {

    static class InMemoryReviewTaskRepo implements ReviewTaskRepository {
        final Map<UUID, ReviewTask> store = new HashMap<>();
        @Override public void save(ReviewTask task) { store.put(task.getId(), task); }
        @Override public Optional<ReviewTask> findById(UUID id) { return Optional.ofNullable(store.get(id)); }
        @Override public Optional<ReviewTask> findActiveByApplicationAndStage(ApplicationId applicationId, ReviewStage stage) { return Optional.empty(); }
        @Override public List<ReviewTask> findAssignedTo(UUID reviewerId) {
            return store.values().stream().filter(t -> reviewerId.equals(t.getAssignedTo()) && t.getStatus()==ReviewTaskStatus.ASSIGNED).toList();
        }
        @Override public List<ReviewTask> findOpenByExamIds(List<UUID> examIds, ReviewStage stage) { return List.of(); }
        @Override public List<ReviewTask> findOpenAll(ReviewStage stage) { return List.of(); }
        @Override public List<ReviewTask> findAssignedAll() { return List.of(); }
    }

    static class InMemoryAuditLogRepo implements ApplicationAuditLogRepository {
        static class Row { ApplicationId appId; ApplicationStatus from; ApplicationStatus to; String actor; String reason; String metadata; LocalDateTime createdAt; }
        final List<Row> rows = new ArrayList<>();
        @Override public void record(ApplicationId applicationId, ApplicationStatus from, ApplicationStatus to, String actor, String reason, String metadata, LocalDateTime at) {
            Row r = new Row(); r.appId = applicationId; r.from = from; r.to = to; r.actor = actor; r.reason = reason; r.metadata = metadata; r.createdAt = at!=null?at:LocalDateTime.now(); rows.add(r);
        }
        @Override public List<ApplicationAuditLogRecord> listByApplication(ApplicationId applicationId) { return List.of(); }
        @Override public long countByActorAndToStatusInBetween(String actor, Collection<ApplicationStatus> toStatuses, LocalDateTime startInclusive, LocalDateTime endExclusive) {
            return rows.stream().filter(r -> Objects.equals(actor, r.actor))
                    .filter(r -> toStatuses.contains(r.to))
                    .filter(r -> !r.createdAt.isBefore(startInclusive) && r.createdAt.isBefore(endExclusive))
                    .count();
        }
    }

    @Test
    void testMyStatsCounts() {
        InMemoryReviewTaskRepo taskRepo = new InMemoryReviewTaskRepo();
        InMemoryAuditLogRepo auditRepo = new InMemoryAuditLogRepo();
        ReviewStatsApplicationService svc = new ReviewStatsApplicationService(taskRepo, auditRepo);

        UUID reviewer = UUID.randomUUID();
        UUID other = UUID.randomUUID();

        // two assigned tasks for reviewer
        ReviewTask t1 = ReviewTask.create(ApplicationId.of(UUID.randomUUID()), ReviewStage.PRIMARY);
        t1.assign(reviewer); taskRepo.save(t1);
        ReviewTask t2 = ReviewTask.create(ApplicationId.of(UUID.randomUUID()), ReviewStage.SECONDARY);
        t2.assign(reviewer); taskRepo.save(t2);

        // today done: one processed by reviewer
        ZoneId z = ZoneId.of("Asia/Shanghai");
        LocalDateTime todayNoon = LocalDate.now(z).atTime(12,0);
        auditRepo.record(ApplicationId.of(UUID.randomUUID()), ApplicationStatus.PENDING_PRIMARY_REVIEW, ApplicationStatus.PRIMARY_PASSED, reviewer.toString(), "ok", null, todayNoon);
        // today but different actor -> ignored
        auditRepo.record(ApplicationId.of(UUID.randomUUID()), ApplicationStatus.PENDING_PRIMARY_REVIEW, ApplicationStatus.PRIMARY_PASSED, other.toString(), "ok", null, todayNoon);
        // today but non-processed status -> ignored
        auditRepo.record(ApplicationId.of(UUID.randomUUID()), ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_PRIMARY_REVIEW, reviewer.toString(), "route", null, todayNoon);

        // this week earlier: processed by reviewer
        LocalDateTime mondayMorning = LocalDate.now(z).with(java.time.DayOfWeek.MONDAY).atStartOfDay().plusHours(1);
        auditRepo.record(ApplicationId.of(UUID.randomUUID()), ApplicationStatus.PENDING_SECONDARY_REVIEW, ApplicationStatus.APPROVED, reviewer.toString(), "ok", null, mondayMorning);

        var stats = svc.getMyStats(reviewer);
        assertEquals(2, stats.myAssigned());
        assertEquals(1, stats.todayDone());
        assertTrue(stats.weekDone() >= stats.todayDone(), "weekDone should be at least todayDone");
        assertTrue(stats.weekDone() >= 1, "weekDone should count at least one processed item this week");
    }
}

