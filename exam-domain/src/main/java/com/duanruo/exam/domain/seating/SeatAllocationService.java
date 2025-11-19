package com.duanruo.exam.domain.seating;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.venue.Venue;

import java.util.List;

/**
 * 座位分配领域服务接口
 */
public interface SeatAllocationService {
    /**
     * 执行座位分配
     *
     * @param strategy 分配策略
     * @param applications 待分配的报名记录
     * @param venues 可用考场
     * @param batchId 批次ID
     * @param customGroupField 自定义分组字段（仅当strategy为CUSTOM_GROUP时使用）
     * @return 座位分配结果列表
     */
    List<SeatAssignment> allocate(
            AllocationStrategy strategy,
            List<Application> applications,
            List<Venue> venues,
            java.util.UUID batchId,
            String customGroupField
    );
}

