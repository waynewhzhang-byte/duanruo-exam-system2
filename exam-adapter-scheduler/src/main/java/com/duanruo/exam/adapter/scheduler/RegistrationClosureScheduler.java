package com.duanruo.exam.adapter.scheduler;

import com.duanruo.exam.application.service.ExamApplicationService;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.ExamStatus;
import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 报名截止自动化调度器
 *
 * 功能：
 * 1. 定时扫描所有开放状态的考试
 * 2. 检查报名截止时间是否已过
 * 3. 自动关闭超过截止时间的考试报名
 *
 * 幂等策略：
 * - 只处理状态为OPEN的考试
 * - 关闭操作是幂等的，重复执行安全
 *
 * 调度策略：
 * - 默认每5分钟执行一次
 * - 可通过配置调整执行频率
 *
 * 多租户支持：
 * - 遍历所有激活的租户
 * - 为每个租户设置租户上下文
 * - 在租户上下文中执行业务逻辑
 */
@Component
public class RegistrationClosureScheduler {

    private static final Logger log = LoggerFactory.getLogger(RegistrationClosureScheduler.class);

    private final TenantRepository tenantRepository;
    private final ExamRepository examRepository;
    private final ExamApplicationService examApplicationService;

    public RegistrationClosureScheduler(
            TenantRepository tenantRepository,
            ExamRepository examRepository,
            ExamApplicationService examApplicationService) {
        this.tenantRepository = tenantRepository;
        this.examRepository = examRepository;
        this.examApplicationService = examApplicationService;
    }

    /**
     * 自动关闭报名定时任务
     *
     * 执行频率：
     * - fixedDelay: 上次执行完成后延迟多久再执行（默认5分钟）
     * - initialDelay: 应用启动后延迟多久开始首次执行（默认1分钟）
     */
    @Scheduled(
        fixedDelayString = "${scheduler.registrationClosure.fixedDelay:300000}",
        initialDelayString = "${scheduler.registrationClosure.initialDelay:60000}"
    )
    public void closeExpiredRegistrations() {
        log.debug("[RegistrationClosure] 开始扫描需要关闭的考试报名");

        // 获取所有激活的租户
        List<Tenant> activeTenants = tenantRepository.findAllActive();

        if (activeTenants.isEmpty()) {
            log.debug("[RegistrationClosure] No active tenants found");
            return;
        }

        log.info("[RegistrationClosure] Found {} active tenant(s)", activeTenants.size());

        // 遍历每个租户
        for (Tenant tenant : activeTenants) {
            try {
                // 设置租户上下文
                TenantContext.setCurrentTenant(tenant.getId());
                log.debug("[RegistrationClosure] Processing tenant: {} ({})", tenant.getName(), tenant.getCode());

                // 在租户上下文中执行业务逻辑
                processRegistrationClosureForTenant(tenant);

            } catch (Exception ex) {
                log.error("[RegistrationClosure] Failed to process tenant: {} ({}), error: {}",
                        tenant.getName(), tenant.getCode(), ex.getMessage(), ex);
            } finally {
                // 清除租户上下文
                TenantContext.clear();
            }
        }

        log.debug("[RegistrationClosure] Registration closure scheduler completed");
    }

    /**
     * 为指定租户执行报名关闭检查
     */
    @Transactional
    protected void processRegistrationClosureForTenant(Tenant tenant) {
        try {
            // 1. 获取所有开放状态的考试
            List<Exam> openExams = examRepository.findByStatus(ExamStatus.OPEN);

            if (openExams.isEmpty()) {
                log.debug("[RegistrationClosure] 没有开放状态的考试 for tenant: {}", tenant.getCode());
                return;
            }

            log.info("[RegistrationClosure] 找到 {} 个开放状态的考试 for tenant: {}", openExams.size(), tenant.getCode());

            // 2. 检查并关闭超过截止时间的考试
            LocalDateTime now = LocalDateTime.now();
            int closedCount = 0;
            int skippedCount = 0;

            for (Exam exam : openExams) {
                try {
                    if (shouldCloseRegistration(exam, now)) {
                        closeExamRegistration(exam, tenant);
                        closedCount++;
                    } else {
                        skippedCount++;
                        log.debug("[RegistrationClosure] 跳过考试: tenant={}, code={}, registrationEnd={}",
                                tenant.getCode(), exam.getCode(), exam.getRegistrationEnd());
                    }
                } catch (Exception e) {
                    log.error("[RegistrationClosure] 关闭考试报名失败: tenant={}, code={}, error={}",
                            tenant.getCode(), exam.getCode(), e.getMessage(), e);
                }
            }

            if (closedCount > 0) {
                log.info("[RegistrationClosure] 完成扫描: tenant={}, 总数={}, 已关闭={}, 跳过={}",
                        tenant.getCode(), openExams.size(), closedCount, skippedCount);
            } else {
                log.debug("[RegistrationClosure] 完成扫描: tenant={}, 总数={}, 已关闭={}, 跳过={}",
                        tenant.getCode(), openExams.size(), closedCount, skippedCount);
            }

        } catch (Exception e) {
            log.error("[RegistrationClosure] 定时任务执行失败 for tenant: {}", tenant.getCode(), e);
        }
    }
    
    /**
     * 判断是否应该关闭报名
     * 
     * @param exam 考试
     * @param now 当前时间
     * @return true 如果应该关闭
     */
    private boolean shouldCloseRegistration(Exam exam, LocalDateTime now) {
        // 1. 检查考试状态
        if (exam.getStatus() != ExamStatus.OPEN) {
            return false;
        }
        
        // 2. 检查报名截止时间
        LocalDateTime registrationEnd = exam.getRegistrationEnd();
        if (registrationEnd == null) {
            log.warn("[RegistrationClosure] 考试没有设置报名截止时间: code={}", exam.getCode());
            return false;
        }
        
        // 3. 判断是否已过截止时间
        return now.isAfter(registrationEnd);
    }
    
    /**
     * 关闭考试报名
     *
     * @param exam 考试
     * @param tenant 租户
     */
    private void closeExamRegistration(Exam exam, Tenant tenant) {
        log.info("[RegistrationClosure] 关闭考试报名: tenant={}, code={}, title={}, registrationEnd={}",
                tenant.getCode(), exam.getCode(), exam.getTitle(), exam.getRegistrationEnd());

        try {
            // 调用应用服务关闭考试
            examApplicationService.closeExam(exam.getId());

            log.info("[RegistrationClosure] 成功关闭考试报名: tenant={}, code={}", tenant.getCode(), exam.getCode());

        } catch (Exception e) {
            log.error("[RegistrationClosure] 关闭考试报名失败: tenant={}, code={}, error={}",
                    tenant.getCode(), exam.getCode(), e.getMessage());
            throw e;
        }
    }
    
    /**
     * 手动触发关闭过期报名（用于测试或手动执行）
     *
     * @return 关闭的考试数量
     */
    public int manualCloseExpiredRegistrations() {
        log.info("[RegistrationClosure] 手动触发关闭过期报名");

        // 获取所有激活的租户
        List<Tenant> activeTenants = tenantRepository.findAllActive();
        int totalClosedCount = 0;

        for (Tenant tenant : activeTenants) {
            try {
                // 设置租户上下文
                TenantContext.setCurrentTenant(tenant.getId());

                List<Exam> openExams = examRepository.findByStatus(ExamStatus.OPEN);
                LocalDateTime now = LocalDateTime.now();
                int closedCount = 0;

                for (Exam exam : openExams) {
                    if (shouldCloseRegistration(exam, now)) {
                        try {
                            closeExamRegistration(exam, tenant);
                            closedCount++;
                        } catch (Exception e) {
                            log.error("[RegistrationClosure] 手动关闭失败: tenant={}, code={}",
                                    tenant.getCode(), exam.getCode(), e);
                        }
                    }
                }

                totalClosedCount += closedCount;
                log.info("[RegistrationClosure] 手动触发完成 for tenant {}: 关闭数量={}",
                        tenant.getCode(), closedCount);

            } catch (Exception ex) {
                log.error("[RegistrationClosure] 手动触发失败 for tenant: {}", tenant.getCode(), ex);
            } finally {
                // 清除租户上下文
                TenantContext.clear();
            }
        }

        log.info("[RegistrationClosure] 手动触发完成: 总关闭数量={}", totalClosedCount);
        return totalClosedCount;
    }
}

