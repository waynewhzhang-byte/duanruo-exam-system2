package com.duanruo.exam.domain.exam;

import java.util.List;
import java.util.Optional;

/**
 * 考试仓储接口
 */
public interface ExamRepository {
    
    /**
     * 保存考试
     */
    void save(Exam exam);
    
    /**
     * 根据ID查找考试
     */
    Optional<Exam> findById(ExamId id);
    
    /**
     * 根据代码查找考试
     */
    Optional<Exam> findByCode(String code);

    /**
     * 查找所有考试
     */
    List<Exam> findAll();
    
    /**
     * 根据状态查找考试
     */
    List<Exam> findByStatus(ExamStatus status);
    
    /**
     * 跨所有租户查找指定状态的考试（用于公开考试列表）
     * 注意：此方法会遍历所有租户schema，性能开销较大，仅用于公开API
     */
    List<Exam> findByStatusAcrossAllTenants(ExamStatus status);
    
    /**
     * 检查考试代码是否存在
     */
    boolean existsByCode(String code);

    /**
     * 删除考试
     */
    void delete(ExamId id);
}
