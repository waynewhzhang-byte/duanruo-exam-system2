package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.seating.*;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SeatingApplicationService {
    private final ExamRepository examRepository;
    private final VenueRepository venueRepository;
    private final ApplicationRepository applicationRepository;
    private final SeatAssignmentRepository seatAssignmentRepository;
    private final AllocationBatchRepository allocationBatchRepository;
    private final TicketApplicationService ticketApplicationService;
    private final SeatAllocationService seatAllocationService;

    public SeatingApplicationService(ExamRepository examRepository,
                                     VenueRepository venueRepository,
                                     ApplicationRepository applicationRepository,
                                     SeatAssignmentRepository seatAssignmentRepository,
                                     AllocationBatchRepository allocationBatchRepository,
                                     TicketApplicationService ticketApplicationService,
                                     SeatAllocationService seatAllocationService) {
        this.examRepository = examRepository;
        this.venueRepository = venueRepository;
        this.applicationRepository = applicationRepository;
        this.seatAssignmentRepository = seatAssignmentRepository;
        this.allocationBatchRepository = allocationBatchRepository;
        this.ticketApplicationService = ticketApplicationService;
        this.seatAllocationService = seatAllocationService;
    }

    /**
     * 使用默认策略分配座位（向后兼容）
     */
    public AllocationResult allocateSeats(UUID examId, String createdBy) {
        return allocateSeats(examId, AllocationStrategy.POSITION_FIRST_SUBMITTED_AT, null, createdBy);
    }

    /**
     * 使用指定策略分配座位
     *
     * @param examId 考试ID
     * @param strategy 分配策略
     * @param customGroupField 自定义分组字段（仅当strategy为CUSTOM_GROUP时使用）
     * @param createdBy 创建人
     * @return 分配结果
     */
    public AllocationResult allocateSeats(UUID examId, AllocationStrategy strategy, String customGroupField, String createdBy) {
        // 验证考试状态
        Exam exam = examRepository.findById(ExamId.of(examId))
                .orElseThrow(() -> new IllegalArgumentException("exam not found"));
        if (exam.getStatus() != com.duanruo.exam.domain.exam.ExamStatus.CLOSED) {
            throw new IllegalStateException("exam must be CLOSED to allocate seats");
        }

        // 获取考场列表
        List<Venue> venues = venueRepository.findByExamId(exam.getId());
        if (venues.isEmpty()) {
            throw new IllegalStateException("no venues configured for exam");
        }

        // 获取符合条件的报名记录
        // 只有已发放准考证的报名才能分配座位
        // TICKET_ISSUED状态意味着审核和支付（如需要）都已完成
        List<Application> all = applicationRepository.findByExam(exam.getId());
        List<Application> eligible = all.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.TICKET_ISSUED)
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            throw new IllegalStateException("no eligible applications to allocate");
        }

        // 创建分配批次
        AllocationBatch batch = AllocationBatch.create(exam.getId(), strategy.getCode(), createdBy);
        UUID batchId = batch.getId();

        // 使用策略服务进行座位分配
        List<SeatAssignment> assignments = seatAllocationService.allocate(
                strategy, eligible, venues, batchId, customGroupField);

        // 保存分配结果
        seatAssignmentRepository.saveAll(assignments);
        batch.setTotals(eligible.size(), assignments.size(), venues.size());
        allocationBatchRepository.save(batch);

        return new AllocationResult(batch.getId(), eligible.size(), assignments.size(), venues.size());
    }

    public IssueResult issueTickets(UUID examId) {
        Exam exam = examRepository.findById(ExamId.of(examId)).orElseThrow(() -> new IllegalArgumentException("exam not found"));
        List<SeatAssignment> assignments = seatAssignmentRepository.findByExamId(exam.getId());
        Set<ApplicationId> assignedApps = assignments.stream().map(SeatAssignment::getApplicationId).collect(Collectors.toSet());
        List<Application> all = applicationRepository.findByExam(exam.getId());
        List<Application> issuable = all.stream()
                .filter(a -> assignedApps.contains(a.getId()))
                .filter(Application::canIssueTicket)
                .collect(Collectors.toList());
        int success = 0;
        for (Application a : issuable) {
            try {
                ticketApplicationService.generate(a.getId().getValue());
                success++;
            } catch (Exception ignored) {}
        }
        return new IssueResult(issuable.size(), success);
    }

    public record AllocationResult(UUID batchId, int totalCandidates, int totalAssigned, int totalVenues) {}
    public record IssueResult(int totalCandidates, int issued) {}
}

