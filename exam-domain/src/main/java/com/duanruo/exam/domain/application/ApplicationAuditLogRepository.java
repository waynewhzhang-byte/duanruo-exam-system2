package com.duanruo.exam.domain.application;

import java.time.LocalDateTime;
import java.util.Collection;

/**
 * 报名申请审计日志仓储端口
 * 记录每次状态变更或重要动作
 */
public interface ApplicationAuditLogRepository {

    /**
     * 记录审计日志
     * @param applicationId 申请ID
     * @param from 原状态（可为null表示初始）
     * @param to 新状态
     * @param actor 执行人（用户名/系统）
     * @param reason 原因/备注（可空）
     * @param metadata 额外元数据（JSON字符串，可空）
     * @param at 时间戳（若为null实现可自行填充now）
     */
    void record(ApplicationId applicationId,
                ApplicationStatus from,
                ApplicationStatus to,
                String actor,
                String reason,
                String metadata,
                LocalDateTime at);

    /**
     * 按申请ID查询审计日志
     */
    java.util.List<ApplicationAuditLogRecord> listByApplication(ApplicationId applicationId);

    /**
     * 统计指定执行人在时间范围内的“已处理”审核数量（按目标状态集合过滤）
     */
    long countByActorAndToStatusInBetween(String actor,
                                          Collection<ApplicationStatus> toStatuses,
                                          LocalDateTime startInclusive,
                                          LocalDateTime endExclusive);
}

