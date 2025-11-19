package com.duanruo.exam.domain.score;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.exam.SubjectId;

import java.util.List;
import java.util.Optional;

/**
 * 考试成绩Repository接口
 * 管理考试成绩的持久化操作
 */
public interface ExamScoreRepository {

    /**
     * 保存考试成绩
     * @param examScore 考试成绩
     */
    void save(ExamScore examScore);

    /**
     * 根据ID查找考试成绩
     * @param id 成绩ID
     * @return 考试成绩，如果不存在则返回空
     */
    Optional<ExamScore> findById(ExamScoreId id);

    /**
     * 根据申请ID和科目ID查找考试成绩
     * @param applicationId 申请ID
     * @param subjectId 科目ID
     * @return 考试成绩，如果不存在则返回空
     */
    Optional<ExamScore> findByApplicationIdAndSubjectId(ApplicationId applicationId, SubjectId subjectId);

    /**
     * 根据申请ID查找所有考试成绩
     * @param applicationId 申请ID
     * @return 考试成绩列表
     */
    List<ExamScore> findByApplicationId(ApplicationId applicationId);

    /**
     * 根据科目ID查找所有考试成绩
     * @param subjectId 科目ID
     * @return 考试成绩列表
     */
    List<ExamScore> findBySubjectId(SubjectId subjectId);

    /**
     * 根据考试ID查找所有考试成绩
     * @param examId 考试ID
     * @return 考试成绩列表
     */
    List<ExamScore> findByExamId(ExamId examId);

    /**
     * 根据岗位ID查找所有考试成绩
     * @param positionId 岗位ID
     * @return 考试成绩列表
     */
    List<ExamScore> findByPositionId(PositionId positionId);

    /**
     * 删除考试成绩
     * @param id 成绩ID
     */
    void deleteById(ExamScoreId id);

    /**
     * 批量保存考试成绩
     * @param examScores 考试成绩列表
     */
    void saveAll(List<ExamScore> examScores);

    /**
     * 检查申请是否已有成绩记录
     * @param applicationId 申请ID
     * @return 是否存在成绩记录
     */
    boolean existsByApplicationId(ApplicationId applicationId);

    /**
     * 统计考试的成绩数量
     * @param examId 考试ID
     * @return 成绩数量
     */
    long countByExamId(ExamId examId);

    /**
     * 统计科目的成绩数量
     * @param subjectId 科目ID
     * @return 成绩数量
     */
    long countBySubjectId(SubjectId subjectId);
}
