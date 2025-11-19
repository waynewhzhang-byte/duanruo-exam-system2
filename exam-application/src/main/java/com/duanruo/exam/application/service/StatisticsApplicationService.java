package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.*;
import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.Position;
import com.duanruo.exam.domain.exam.PositionRepository;
import com.duanruo.exam.domain.payment.PaymentOrderRepository;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.domain.ticket.TicketRepository;
import com.duanruo.exam.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据分析统计应用服务
 * 支持超级管理员和租户管理员两个层面的统计
 */
@Service
@Transactional(readOnly = true)
public class StatisticsApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ExamRepository examRepository;
    private final PositionRepository positionRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final SeatAssignmentRepository seatAssignmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    public StatisticsApplicationService(
            ApplicationRepository applicationRepository,
            ExamRepository examRepository,
            PositionRepository positionRepository,
            PaymentOrderRepository paymentOrderRepository,
            SeatAssignmentRepository seatAssignmentRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            TenantRepository tenantRepository) {
        this.applicationRepository = applicationRepository;
        this.examRepository = examRepository;
        this.positionRepository = positionRepository;
        this.paymentOrderRepository = paymentOrderRepository;
        this.seatAssignmentRepository = seatAssignmentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
    }

    /**
     * 获取报名统计（租户级别）
     */
    public ApplicationStatisticsDTO getApplicationStatistics(UUID examId) {
        List<Application> applications = applicationRepository.findByExam(ExamId.of(examId));

        // 总体统计
        long totalApplications = applications.size();
        long pendingReview = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING_PRIMARY_REVIEW ||
                           a.getStatus() == ApplicationStatus.PENDING_SECONDARY_REVIEW)
                .count();
        long approved = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPROVED)
                .count();
        long rejected = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PRIMARY_REJECTED ||
                           a.getStatus() == ApplicationStatus.SECONDARY_REJECTED)
                .count();

        // 支付统计
        long paid = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PAID)
                .count();
        long unpaid = approved - paid;

        // 按岗位统计
        Map<String, Long> applicationsByPosition = applications.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getPositionId().getValue().toString(),
                        Collectors.counting()
                ));

        // 按状态统计
        Map<String, Long> applicationsByStatus = applications.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().name(),
                        Collectors.counting()
                ));

        // 按日期统计（最近7天）
        Map<String, Long> applicationsByDate = getApplicationsByDate(examId, 7);

        // 转化率
        double approvalRate = totalApplications > 0 ? (double) approved / totalApplications * 100 : 0.0;
        double paymentRate = approved > 0 ? (double) paid / approved * 100 : 0.0;

        return new ApplicationStatisticsDTO(
                totalApplications,
                pendingReview,
                approved,
                rejected,
                paid,
                unpaid,
                applicationsByPosition,
                applicationsByStatus,
                applicationsByDate,
                approvalRate,
                paymentRate
        );
    }

    /**
     * 获取考试统计（租户级别）
     */
    public ExamStatisticsDTO getExamStatistics(UUID examId) {
        Exam exam = examRepository.findById(ExamId.of(examId))
                .orElseThrow(() -> new IllegalArgumentException("考试不存在"));

        List<Application> applications = applicationRepository.findByExam(ExamId.of(examId));

        // 报名统计
        long totalApplications = applications.size();
        long approvedApplications = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.PAID)
                .count();
        long rejectedApplications = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PRIMARY_REJECTED ||
                           a.getStatus() == ApplicationStatus.SECONDARY_REJECTED)
                .count();
        long paidApplications = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PAID)
                .count();

        // 岗位统计
        List<Position> positions = positionRepository.findByExamId(ExamId.of(examId));
        int totalPositions = positions.size();

        Map<String, ExamStatisticsDTO.PositionStatistics> positionStatistics = new HashMap<>();
        for (Position position : positions) {
            long positionApplications = applications.stream()
                    .filter(a -> a.getPositionId().equals(position.getId()))
                    .count();
            long positionApproved = applications.stream()
                    .filter(a -> a.getPositionId().equals(position.getId()) &&
                               (a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.PAID))
                    .count();
            long positionRejected = applications.stream()
                    .filter(a -> a.getPositionId().equals(position.getId()) &&
                               (a.getStatus() == ApplicationStatus.PRIMARY_REJECTED ||
                                a.getStatus() == ApplicationStatus.SECONDARY_REJECTED))
                    .count();
            long positionPaid = applications.stream()
                    .filter(a -> a.getPositionId().equals(position.getId()) &&
                               a.getStatus() == ApplicationStatus.PAID)
                    .count();

            int maxApplicants = position.getQuota() != null ? position.getQuota() : 0;
            double fillRate = maxApplicants > 0 ? (double) positionApplications / maxApplicants * 100 : 0.0;

            positionStatistics.put(position.getId().getValue().toString(),
                    new ExamStatisticsDTO.PositionStatistics(
                            position.getId().getValue().toString(),
                            position.getTitle(),
                            positionApplications,
                            positionApproved,
                            positionRejected,
                            positionPaid,
                            maxApplicants,
                            fillRate
                    ));
        }

        // 审核统计
        long pendingFirstReview = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING_PRIMARY_REVIEW)
                .count();
        long pendingSecondReview = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING_SECONDARY_REVIEW)
                .count();
        // 自动审核统计（暂时设为0，因为ApplicationStatus没有AUTO_APPROVED/AUTO_REJECTED状态）
        long autoApproved = 0;
        long autoRejected = 0;

        // 支付统计
        List<com.duanruo.exam.domain.payment.PaymentOrder> payments = paymentOrderRepository.findByExamId(ExamId.of(examId));
        double totalRevenue = payments.stream()
                .filter(p -> p.getStatus() == com.duanruo.exam.domain.payment.PaymentStatus.SUCCESS)
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();
        double averagePaymentAmount = paidApplications > 0 ? totalRevenue / paidApplications : 0.0;

        // 座位分配统计
        List<SeatAssignment> seatAssignments = seatAssignmentRepository.findByExamId(ExamId.of(examId));
        long assignedSeats = seatAssignments.size();
        long unassignedSeats = paidApplications - assignedSeats;

        // 准考证统计
        long ticketsIssued = ticketRepository.countByExamId(ExamId.of(examId));
        long ticketsNotIssued = paidApplications - ticketsIssued;

        return new ExamStatisticsDTO(
                examId.toString(),
                exam.getTitle(),
                totalApplications,
                approvedApplications,
                rejectedApplications,
                paidApplications,
                totalPositions,
                positionStatistics,
                pendingFirstReview,
                pendingSecondReview,
                autoApproved,
                autoRejected,
                totalRevenue,
                averagePaymentAmount,
                assignedSeats,
                unassignedSeats,
                ticketsIssued,
                ticketsNotIssued
        );
    }

    /**
     * 获取租户统计（仅超级管理员）
     *
     * 注意：由于当前多租户架构基于Schema隔离，跨租户查询需要特殊处理。
     * 此方法暂时返回基本的租户信息统计，不包含跨Schema的数据聚合。
     */
    @Transactional(readOnly = true)
    public TenantStatisticsDTO getTenantStatistics(String tenantId) {
        // 获取租户信息
        com.duanruo.exam.domain.tenant.Tenant tenant = tenantRepository
                .findById(com.duanruo.exam.shared.domain.TenantId.of(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        // 注意：以下统计数据需要在租户的Schema上下文中查询
        // 当前实现返回占位数据，实际应用中需要切换到对应租户的Schema

        return new TenantStatisticsDTO(
                tenant.getId().getValue().toString(),
                tenant.getName(),
                0L,  // totalExams - 需要跨Schema查询
                0L,  // activeExams
                0L,  // completedExams
                0L,  // totalApplications
                0L,  // approvedApplications
                0L,  // rejectedApplications
                0L,  // paidApplications
                0L,  // totalUsers
                0L,  // activeUsers
                0.0, // totalRevenue
                new ArrayList<>() // recentExams
        );
    }

    /**
     * 获取平台统计（仅超级管理员）
     *
     * 注意：由于当前多租户架构基于Schema隔离，跨租户聚合查询需要特殊处理。
     * 此方法暂时返回基本的平台信息统计，不包含跨Schema的数据聚合。
     */
    @Transactional(readOnly = true)
    public PlatformStatisticsDTO getPlatformStatistics() {
        // 获取所有租户
        List<com.duanruo.exam.domain.tenant.Tenant> allTenants = tenantRepository.findAll();
        List<com.duanruo.exam.domain.tenant.Tenant> activeTenants = tenantRepository.findAllActive();

        // 注意：以下统计数据需要聚合所有租户Schema的数据
        // 当前实现返回基本的租户统计，实际应用中需要遍历所有租户Schema进行聚合

        return new PlatformStatisticsDTO(
                (long) allTenants.size(),
                (long) activeTenants.size(),
                0L,  // totalExams - 需要跨Schema聚合
                0L,  // activeExams
                0L,  // completedExams
                0L,  // totalApplications
                0L,  // approvedApplications
                0L,  // rejectedApplications
                0L,  // paidApplications
                0L,  // totalUsers
                0L,  // activeUsers
                0.0, // totalRevenue
                0.0, // averageRevenuePerTenant
                new ArrayList<>(), // topTenantsByApplications
                new ArrayList<>(), // topTenantsByRevenue
                new LinkedHashMap<>(), // applicationTrend
                new LinkedHashMap<>()  // revenueTrend
        );
    }

    // Helper methods

    private Map<String, Long> getApplicationsByDate(UUID examId, int days) {
        // 简化实现：从所有申请中按日期分组统计
        List<Application> applications = applicationRepository.findByExam(ExamId.of(examId));

        Map<String, Long> dateMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 初始化最近N天的日期
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            dateMap.put(date.format(formatter), 0L);
        }

        // 统计每天的申请数量
        for (Application app : applications) {
            if (app.getCreatedAt() != null) {
                String dateStr = app.getCreatedAt().toLocalDate().format(formatter);
                if (dateMap.containsKey(dateStr)) {
                    dateMap.put(dateStr, dateMap.get(dateStr) + 1);
                }
            }
        }

        return dateMap;
    }
}

