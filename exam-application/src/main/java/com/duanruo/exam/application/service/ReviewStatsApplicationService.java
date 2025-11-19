package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.ApplicationAuditLogRepository;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.review.ReviewTaskRepository;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Service
public class ReviewStatsApplicationService {

    private static final ZoneId ZONE_SHANGHAI = ZoneId.of("Asia/Shanghai");

    private final ReviewTaskRepository reviewTaskRepository;
    private final ApplicationAuditLogRepository auditLogRepository;

    public ReviewStatsApplicationService(ReviewTaskRepository reviewTaskRepository,
                                         ApplicationAuditLogRepository auditLogRepository) {
        this.reviewTaskRepository = reviewTaskRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public record MyReviewStatsResponse(int myAssigned, int todayDone, int weekDone) {}

    public MyReviewStatsResponse getMyStats(UUID reviewerId) {
        int myAssigned = reviewTaskRepository.findAssignedTo(reviewerId).size();

        Set<ApplicationStatus> processedStatuses = EnumSet.of(
                ApplicationStatus.PRIMARY_PASSED,
                ApplicationStatus.PRIMARY_REJECTED,
                ApplicationStatus.SECONDARY_REJECTED,
                ApplicationStatus.APPROVED
        );

        LocalDate today = LocalDate.now(ZONE_SHANGHAI);
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);

        int todayDone = (int) auditLogRepository.countByActorAndToStatusInBetween(
                reviewerId.toString(), processedStatuses, startOfToday, endOfToday);

        // week starts on Monday in Asia/Shanghai
        LocalDate startOfWeekDate = today.with(java.time.DayOfWeek.MONDAY);
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();
        LocalDateTime endOfNow = LocalDateTime.now(ZONE_SHANGHAI);

        int weekDone = (int) auditLogRepository.countByActorAndToStatusInBetween(
                reviewerId.toString(), processedStatuses, startOfWeek, endOfNow);

        return new MyReviewStatsResponse(myAssigned, todayDone, weekDone);
    }
}

