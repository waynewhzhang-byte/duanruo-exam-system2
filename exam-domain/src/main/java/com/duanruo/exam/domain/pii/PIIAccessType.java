package com.duanruo.exam.domain.pii;

/**
 * PII数据访问类型枚举
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
public enum PIIAccessType {
    
    /**
     * 读取
     * 通过API或页面查看PII数据
     */
    READ,
    
    /**
     * 导出
     * 导出包含PII数据的文件（Excel, CSV等）
     */
    EXPORT,
    
    /**
     * 下载
     * 下载包含PII数据的附件或文件
     */
    DOWNLOAD,
    
    /**
     * 打印
     * 打印包含PII数据的文档
     */
    PRINT,
    
    /**
     * 修改
     * 修改PII数据
     */
    UPDATE,
    
    /**
     * 删除
     * 删除PII数据
     */
    DELETE
}

