package com.duanruo.exam.domain.admin;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.user.UserId;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 考试管理员Repository接口
 * 管理考试与管理员的关联关系
 */
public interface ExamAdminRepository {

    /**
     * 添加考试管理员
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @param permissions 权限配置
     * @param createdBy 操作者ID
     */
    void add(ExamId examId, UserId adminId, Map<String, Object> permissions, UserId createdBy);

    /**
     * 移除考试管理员
     * @param examId 考试ID
     * @param adminId 管理员ID
     */
    void remove(ExamId examId, UserId adminId);

    /**
     * 检查用户是否是指定考试的管理员
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @return 是否是管理员
     */
    boolean exists(ExamId examId, UserId adminId);

    /**
     * 查找用户管理的所有考试ID
     * @param adminId 管理员ID
     * @return 考试ID列表
     */
    List<ExamId> findExamIdsByAdmin(UserId adminId);

    /**
     * 查找考试的所有管理员ID
     * @param examId 考试ID
     * @return 管理员ID列表
     */
    List<UserId> findAdminIdsByExam(ExamId examId);

    /**
     * 获取管理员在指定考试中的权限配置
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @return 权限配置，如果不存在则返回空
     */
    Optional<Map<String, Object>> findPermissions(ExamId examId, UserId adminId);

    /**
     * 更新管理员在指定考试中的权限配置
     * @param examId 考试ID
     * @param adminId 管理员ID
     * @param permissions 新的权限配置
     */
    void updatePermissions(ExamId examId, UserId adminId, Map<String, Object> permissions);

    /**
     * 批量添加考试管理员
     * @param examId 考试ID
     * @param adminIds 管理员ID列表
     * @param permissions 权限配置
     * @param createdBy 操作者ID
     */
    void addBatch(ExamId examId, List<UserId> adminIds, Map<String, Object> permissions, UserId createdBy);

    /**
     * 批量移除考试管理员
     * @param examId 考试ID
     * @param adminIds 管理员ID列表
     */
    void removeBatch(ExamId examId, List<UserId> adminIds);

    /**
     * 查找所有考试管理员关联关系
     * @return 考试ID到管理员ID列表的映射
     */
    Map<ExamId, List<UserId>> findAllExamAdmins();
}
