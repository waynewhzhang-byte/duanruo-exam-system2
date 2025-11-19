package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.score.ExamScore;
import com.duanruo.exam.domain.score.ExamScoreRepository;
import com.duanruo.exam.domain.exam.Subject;
import com.duanruo.exam.domain.exam.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 面试资格判定服务
 * 基于笔试成绩判定候选人面试资格
 */
@Service
@Transactional
public class InterviewEligibilityService {

    private final ExamScoreRepository examScoreRepository;
    private final ApplicationRepository applicationRepository;
    private final SubjectRepository subjectRepository;

    public InterviewEligibilityService(ExamScoreRepository examScoreRepository,
                                     ApplicationRepository applicationRepository,
                                     SubjectRepository subjectRepository) {
        this.examScoreRepository = examScoreRepository;
        this.applicationRepository = applicationRepository;
        this.subjectRepository = subjectRepository;
    }

    /**
     * 判定单个申请的面试资格
     * @param applicationId 申请ID
     * @return 是否有面试资格
     */
    public boolean checkInterviewEligibility(UUID applicationId) {
        // 1. 获取申请信息
        Application application = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 2. 检查申请状态是否允许判定面试资格
        if (application.getStatus() != ApplicationStatus.WRITTEN_EXAM_COMPLETED) {
            return false;
        }

        // 3. 获取所有成绩
        List<ExamScore> scores = examScoreRepository.findByApplicationId(ApplicationId.of(applicationId));
        
        if (scores.isEmpty()) {
            return false;
        }

        // 4. 检查所有笔试科目是否及格
        return checkWrittenExamPassing(scores);
    }

    /**
     * 更新申请的面试资格状态
     * @param applicationId 申请ID
     */
    public void updateInterviewEligibilityStatus(UUID applicationId) {
        Application application = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 只有在笔试完成状态才能更新面试资格
        if (application.getStatus() != ApplicationStatus.WRITTEN_EXAM_COMPLETED) {
            return;
        }

        boolean isEligible = checkInterviewEligibility(applicationId);
        
        if (isEligible) {
            // 更新为有面试资格
            application.updateStatus(ApplicationStatus.INTERVIEW_ELIGIBLE);
        } else {
            // 更新为笔试不及格
            application.updateStatus(ApplicationStatus.WRITTEN_EXAM_FAILED);
        }

        applicationRepository.save(application);
    }

    /**
     * 批量更新考试的所有申请面试资格状态
     * @param examId 考试ID
     * @return 更新的申请数量
     */
    public int batchUpdateInterviewEligibility(UUID examId) {
        // 获取所有笔试完成的申请
        List<Application> applications = applicationRepository.findByExamIdAndStatus(
                examId, ApplicationStatus.WRITTEN_EXAM_COMPLETED);

        int updatedCount = 0;
        for (Application application : applications) {
            try {
                updateInterviewEligibilityStatus(application.getId().getValue());
                updatedCount++;
            } catch (Exception e) {
                // 记录错误但继续处理其他申请
                // TODO: 添加日志记录
            }
        }

        return updatedCount;
    }

    /**
     * 获取面试资格统计信息
     * @param examId 考试ID
     * @return 面试资格统计
     */
    @Transactional(readOnly = true)
    public InterviewEligibilityStatistics getInterviewEligibilityStatistics(UUID examId) {
        List<Application> completedApplications = applicationRepository.findByExamIdAndStatus(
                examId, ApplicationStatus.WRITTEN_EXAM_COMPLETED);
        
        List<Application> eligibleApplications = applicationRepository.findByExamIdAndStatus(
                examId, ApplicationStatus.INTERVIEW_ELIGIBLE);
        
        List<Application> failedApplications = applicationRepository.findByExamIdAndStatus(
                examId, ApplicationStatus.WRITTEN_EXAM_FAILED);

        return new InterviewEligibilityStatistics(
                examId,
                completedApplications.size(),
                eligibleApplications.size(),
                failedApplications.size()
        );
    }

    /**
     * 检查笔试科目是否及格
     */
    private boolean checkWrittenExamPassing(List<ExamScore> scores) {
        // 获取所有笔试科目的成绩
        List<ExamScore> writtenScores = scores.stream()
                .filter(score -> {
                    Optional<Subject> subject = subjectRepository.findById(score.getSubjectId());
                    return subject.isPresent() && subject.get().getType() == com.duanruo.exam.domain.exam.SubjectType.WRITTEN;
                })
                .toList();

        if (writtenScores.isEmpty()) {
            return false;
        }

        // 检查所有笔试科目是否及格
        return writtenScores.stream()
                .allMatch(score -> {
                    if (score.isAbsent()) {
                        return false;
                    }
                    
                    Optional<Subject> subject = subjectRepository.findById(score.getSubjectId());
                    if (subject.isEmpty()) {
                        return false;
                    }
                    
                    return score.isPassing(subject.get().getPassingScore());
                });
    }

    /**
     * 面试资格统计信息
     */
    public record InterviewEligibilityStatistics(
            UUID examId,
            int totalCompleted,
            int eligible,
            int failed
    ) {
        public int getPendingCount() {
            return totalCompleted - eligible - failed;
        }
        
        public double getEligibilityRate() {
            if (totalCompleted == 0) return 0.0;
            return (double) eligible / totalCompleted * 100;
        }
    }
}
