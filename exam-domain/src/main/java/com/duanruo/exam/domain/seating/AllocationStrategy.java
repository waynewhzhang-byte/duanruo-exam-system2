package com.duanruo.exam.domain.seating;

/**
 * 座位分配策略枚举
 */
public enum AllocationStrategy {
    /**
     * 按岗位分组 + 按提交时间排序（默认策略）
     * 相同岗位的考生尽量安排在同一考场
     */
    POSITION_FIRST_SUBMITTED_AT("position-first+submittedAt", "按岗位分组+提交时间"),
    
    /**
     * 完全随机分配
     * 打乱所有考生顺序，随机分配座位
     */
    RANDOM("random", "完全随机分配"),
    
    /**
     * 按报名时间优先
     * 按报名时间先后顺序分配座位，不考虑岗位分组
     */
    SUBMITTED_AT_FIRST("submittedAt-first", "按报名时间优先"),
    
    /**
     * 按岗位分组 + 随机
     * 相同岗位的考生安排在同一考场，但岗位内随机排序
     */
    POSITION_FIRST_RANDOM("position-first+random", "按岗位分组+随机"),
    
    /**
     * 按自定义分组字段
     * 根据报名表单中的自定义字段进行分组
     */
    CUSTOM_GROUP("custom-group", "按自定义分组");
    
    private final String code;
    private final String description;
    
    AllocationStrategy(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public static AllocationStrategy fromCode(String code) {
        for (AllocationStrategy strategy : values()) {
            if (strategy.code.equals(code)) {
                return strategy;
            }
        }
        return POSITION_FIRST_SUBMITTED_AT; // 默认策略
    }
}

