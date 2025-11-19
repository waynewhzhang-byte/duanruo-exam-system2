package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.*;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.review.ReviewStage;
import com.duanruo.exam.domain.review.ReviewTask;
import com.duanruo.exam.domain.review.ReviewTaskRepository;
import com.duanruo.exam.domain.review.ReviewTaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReviewQueueApplicationServiceTest {

    private ApplicationRepository applicationRepository;
    private ApplicationAuditLogRepository auditLogRepository;
    private ReviewTaskRepository reviewTaskRepository;
    private ReviewQueueApplicationService service;

    static class FakeReviewTaskRepo implements ReviewTaskRepository {
        Map<UUID, ReviewTask> store = new ConcurrentHashMap<>();
        @Override public void save(ReviewTask task) { store.put(task.getId(), task); }
        @Override public Optional<ReviewTask> findById(UUID id) { return Optional.ofNullable(store.get(id)); }
        @Override public Optional<ReviewTask> findActiveByApplicationAndStage(ApplicationId applicationId, com.duanruo.exam.domain.review.ReviewStage stage) {
            return store.values().stream()
                    .filter(t -> t.getApplicationId().equals(applicationId) && t.getStage()==stage)
                    .filter(t -> t.getStatus()!= ReviewTaskStatus.COMPLETED && t.getStatus()!= ReviewTaskStatus.CANCELLED)
                    .findFirst();
        }
        @Override public java.util.List<ReviewTask> findAssignedTo(UUID reviewerId) {
            return store.values().stream().filter(t -> reviewerId.equals(t.getAssignedTo())).toList();
        }
            @Override public java.util.List<ReviewTask> findOpenByExamIds(java.util.List<java.util.UUID> examIds, ReviewStage stage) { return java.util.List.of(); }
            @Override public java.util.List<ReviewTask> findOpenAll(ReviewStage stage) {
                return store.values().stream().filter(t -> t.getStatus()==ReviewTaskStatus.OPEN)
                        .filter(t -> stage==null || t.getStage()==stage).toList();
            }
            @Override public java.util.List<ReviewTask> findAssignedAll() {
                return store.values().stream().filter(t -> t.getStatus()==ReviewTaskStatus.ASSIGNED).toList();
            }

    }

    @BeforeEach
    void setUp() {
        applicationRepository = mock(ApplicationRepository.class);
        auditLogRepository = mock(ApplicationAuditLogRepository.class);
        reviewTaskRepository = new FakeReviewTaskRepo();
        service = new ReviewQueueApplicationService(applicationRepository, auditLogRepository, reviewTaskRepository);
    }

    @Test
    void pull_and_decide_primary_with_evidence() {
        UUID examId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        UUID reviewer = UUID.randomUUID();

        Application app = Application.create(ExamId.of(examId), PositionId.of(positionId), CandidateId.of(candidateId));
        app.updateFormData("{\"education\":\"Bachelor\"}");
        app.submit();
        app.applyAutoReviewResult("AUTO", ApplicationStatus.PENDING_PRIMARY_REVIEW);

        when(applicationRepository.findByStatus(ApplicationStatus.PENDING_PRIMARY_REVIEW)).thenReturn(List.of(app));
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        var pull = service.pullNext(examId, ReviewStage.PRIMARY, reviewer);
        assertThat(pull).isNotNull();
        assertThat(pull.isEmpty()).isFalse();

        var result = service.decide(pull.taskId(), reviewer, true, "ok", List.of(UUID.randomUUID()));
        assertThat(result.to()).isEqualTo(ApplicationStatus.PRIMARY_PASSED);
        verify(auditLogRepository, atLeastOnce()).record(eq(app.getId()), eq(ApplicationStatus.PENDING_PRIMARY_REVIEW), eq(ApplicationStatus.PRIMARY_PASSED), anyString(), anyString(), anyString(), any());
    }

    @Test
    void pullNext_returns_existing_assigned_task_for_reviewer() {
        UUID examId = UUID.randomUUID();
        UUID positionId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();
        UUID reviewer = UUID.randomUUID();

        Application app = Application.create(ExamId.of(examId), PositionId.of(positionId), CandidateId.of(candidateId));

        // ensure no new candidates
        when(applicationRepository.findByStatus(any())).thenReturn(List.of());

        // pre-create assigned task for reviewer
        ReviewTask t = ReviewTask.create(app.getId(), ReviewStage.PRIMARY);
        t.assign(reviewer);
        ((FakeReviewTaskRepo) reviewTaskRepository).save(t);

        var pull = service.pullNext(examId, ReviewStage.PRIMARY, reviewer);
        assertThat(pull.isEmpty()).isFalse();
        assertThat(pull.taskId()).isEqualTo(t.getId());
    }
    @Test
    void pullNext_prefers_matching_position_when_specified() {
        UUID examId = UUID.randomUUID();
        UUID posA = UUID.randomUUID();
        UUID posB = UUID.randomUUID();
        UUID cand1 = UUID.randomUUID();
        UUID cand2 = UUID.randomUUID();
        UUID reviewer = UUID.randomUUID();

        Application a1 = Application.create(ExamId.of(examId), PositionId.of(posA), CandidateId.of(cand1));
        a1.updateFormData("{}"); a1.submit(); a1.applyAutoReviewResult("AUTO", ApplicationStatus.PENDING_PRIMARY_REVIEW);
        Application a2 = Application.create(ExamId.of(examId), PositionId.of(posB), CandidateId.of(cand2));
        a2.updateFormData("{}"); a2.submit(); a2.applyAutoReviewResult("AUTO", ApplicationStatus.PENDING_PRIMARY_REVIEW);

        // ensure a1 is older than a2 by statusUpdatedAt default order (submit earlier)
        when(applicationRepository.findByStatus(ApplicationStatus.PENDING_PRIMARY_REVIEW)).thenReturn(List.of(a1, a2));

        // request with preferred position = posB, should pick a2 even if a1 is earlier
        var pull = service.pullNext(examId, ReviewStage.PRIMARY, reviewer, posB);
        assertThat(pull.isEmpty()).isFalse();
        assertThat(pull.applicationId()).isEqualTo(a2.getId().getValue());
    }



}
