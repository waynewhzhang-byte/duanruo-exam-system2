package com.duanruo.exam.adapter.scheduler;

import com.duanruo.exam.application.service.SeatingApplicationService;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.ExamStatus;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 自动调度：在考试报名关闭后，批量进行座位分配与发证。
 * 幂等策略：
 *  - 若已存在座位分配记录（该考试下），则跳过分配；
 *  - 发证基于 SeatingApplicationService.issueTickets 的可发条件过滤，重复执行安全。
 *
 * 多租户支持：
 *  - 遍历所有激活的租户
 *  - 为每个租户设置租户上下文
 *  - 在租户上下文中执行业务逻辑
 */
@Component
public class AutoSeatingScheduler {
    private static final Logger log = LoggerFactory.getLogger(AutoSeatingScheduler.class);

    private final TenantRepository tenantRepository;
    private final ExamRepository examRepository;
    private final SeatAssignmentRepository seatAssignmentRepository;
    private final SeatingApplicationService seatingService;

    public AutoSeatingScheduler(TenantRepository tenantRepository,
                                ExamRepository examRepository,
                                SeatAssignmentRepository seatAssignmentRepository,
                                SeatingApplicationService seatingService) {
        this.tenantRepository = tenantRepository;
        this.examRepository = examRepository;
        this.seatAssignmentRepository = seatAssignmentRepository;
        this.seatingService = seatingService;
    }

    @Scheduled(fixedDelayString = "${scheduler.autoSeating.fixedDelay:600000}",
               initialDelayString = "${scheduler.autoSeating.initialDelay:60000}")
    public void runAutoSeating() {
        log.debug("[AutoSeating] Starting auto seating scheduler");

        // 获取所有激活的租户
        List<Tenant> activeTenants = tenantRepository.findAllActive();

        if (activeTenants.isEmpty()) {
            log.debug("[AutoSeating] No active tenants found");
            return;
        }

        log.info("[AutoSeating] Found {} active tenant(s)", activeTenants.size());

        // 遍历每个租户
        for (Tenant tenant : activeTenants) {
            try {
                // 设置租户上下文
                TenantContext.setCurrentTenant(tenant.getId());
                log.debug("[AutoSeating] Processing tenant: {} ({})", tenant.getName(), tenant.getCode());

                // 在租户上下文中执行业务逻辑
                processAutoSeatingForTenant(tenant);

            } catch (Exception ex) {
                log.error("[AutoSeating] Failed to process tenant: {} ({}), error: {}",
                        tenant.getName(), tenant.getCode(), ex.getMessage(), ex);
            } finally {
                // 清除租户上下文
                TenantContext.clear();
            }
        }

        log.debug("[AutoSeating] Auto seating scheduler completed");
    }

    /**
     * 为指定租户执行自动座位分配
     */
    @Transactional
    protected void processAutoSeatingForTenant(Tenant tenant) {
        List<Exam> closed = examRepository.findByStatus(ExamStatus.CLOSED);

        if (closed.isEmpty()) {
            log.debug("[AutoSeating] No closed exams found for tenant: {}", tenant.getCode());
            return;
        }

        log.info("[AutoSeating] Found {} closed exam(s) for tenant: {}", closed.size(), tenant.getCode());

        for (Exam exam : closed) {
            try {
                var existing = seatAssignmentRepository.findByExamId(exam.getId());
                if (existing == null || existing.isEmpty()) {
                    var result = seatingService.allocateSeats(exam.getId().getValue(), "SYSTEM_SCHEDULER");
                    log.info("[AutoSeating] allocated seats: tenant={}, exam={}, batch={}, candidates={}, assigned={}",
                            tenant.getCode(), exam.getCode(), result.batchId(), result.totalCandidates(), result.totalAssigned());
                } else {
                    log.debug("[AutoSeating] skip allocate, already has {} assignments for exam {} in tenant {}",
                            existing.size(), exam.getCode(), tenant.getCode());
                }
                var issue = seatingService.issueTickets(exam.getId().getValue());
                if (issue.issued() > 0) {
                    log.info("[AutoSeating] issued tickets: tenant={}, exam={}, totalCandidates={}, issued={}",
                            tenant.getCode(), exam.getCode(), issue.totalCandidates(), issue.issued());
                }
            } catch (Exception ex) {
                log.warn("[AutoSeating] exam {} in tenant {} failed: {}",
                        exam.getCode(), tenant.getCode(), ex.getMessage());
            }
        }
    }
}

