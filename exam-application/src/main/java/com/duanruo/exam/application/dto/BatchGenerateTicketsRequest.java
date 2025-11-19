package com.duanruo.exam.application.dto;

import java.util.List;
import java.util.UUID;

/**
 * 批量生成准考证请求DTO
 */
public class BatchGenerateTicketsRequest {
    
    private UUID examId;
    private List<UUID> applicationIds; // 可选：指定报名ID列表，为空则生成所有符合条件的
    
    public UUID getExamId() {
        return examId;
    }
    
    public void setExamId(UUID examId) {
        this.examId = examId;
    }
    
    public List<UUID> getApplicationIds() {
        return applicationIds;
    }
    
    public void setApplicationIds(List<UUID> applicationIds) {
        this.applicationIds = applicationIds;
    }
}

