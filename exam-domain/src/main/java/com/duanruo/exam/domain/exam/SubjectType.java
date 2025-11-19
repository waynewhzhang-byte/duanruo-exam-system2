package com.duanruo.exam.domain.exam;

/**
 * 科目类型枚举
 */
public enum SubjectType {
    
    /**
     * 笔试
     */
    WRITTEN("written"),
    
    /**
     * 面试
     */
    INTERVIEW("interview"),
    
    /**
     * 实际操作
     */
    PRACTICAL("practical");
    
    private final String value;
    
    SubjectType(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    /**
     * 是否需要现场考试
     */
    public boolean requiresPhysicalPresence() {
        return this == INTERVIEW || this == PRACTICAL;
    }
    
    /**
     * 是否支持在线考试
     */
    public boolean supportsOnlineExam() {
        return this == WRITTEN;
    }
}
