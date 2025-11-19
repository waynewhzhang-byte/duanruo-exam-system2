package com.duanruo.exam.domain.application;

import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;

import java.util.List;
import java.util.Optional;

/**
 * 申请仓储接口
 */
public interface ApplicationRepository {
    
    /**
     * 保存申请
     */
    void save(Application application);
    
    /**
     * 根据ID查找申请
     */
    Optional<Application> findById(ApplicationId id);
    
    /**
     * 根据考试和候选人查找申请
     */
    Optional<Application> findByExamAndCandidate(ExamId examId, CandidateId candidateId);
    
    /**
     * 根据候选人查找所有申请
     */
    List<Application> findByCandidate(CandidateId candidateId);
    
    /**
     * 根据考试查找所有申请
     */
    List<Application> findByExam(ExamId examId);
    
    /**
     * 根据岗位查找所有申请
     */
    List<Application> findByPosition(PositionId positionId);
    
    /**
     * 根据状态查找申请
     */
    List<Application> findByStatus(ApplicationStatus status);

    /**
     * 根据考试ID和状态查找申请
     */
    List<Application> findByExamIdAndStatus(java.util.UUID examId, ApplicationStatus status);

    /**
     * 统计岗位的申请数量
     */
    long countByPosition(PositionId positionId);

    /**
     * 检查候选人是否已报名某考试
     */
    boolean existsByExamAndCandidate(ExamId examId, CandidateId candidateId);

    /**
     * 检查岗位是否有已提交的报名（非草稿状态）
     * 用于判断岗位表单配置是否可以修改
     * @param positionId 岗位ID
     * @return 是否有已提交的报名
     */
    boolean hasSubmittedApplications(PositionId positionId);

    /**
     * 检查考试是否有已提交的报名（非草稿状态）
     * 用于判断考试表单配置是否可以修改
     * @param examId 考试ID
     * @return 是否有已提交的报名
     */
    boolean hasSubmittedApplicationsForExam(ExamId examId);

    /**
     * 删除申请
     */
    void delete(ApplicationId id);
}
