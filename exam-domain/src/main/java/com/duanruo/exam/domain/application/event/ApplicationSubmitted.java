package com.duanruo.exam.domain.application.event;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.shared.event.DomainEvent;

/**
 * 申请已提交事件
 */
public class ApplicationSubmitted extends DomainEvent {
    
    private final ApplicationId applicationId;
    private final ExamId examId;
    private final PositionId positionId;
    private final CandidateId candidateId;
    
    public ApplicationSubmitted(ApplicationId applicationId, ExamId examId, 
                               PositionId positionId, CandidateId candidateId) {
        super("Application", applicationId.getValue());
        this.applicationId = applicationId;
        this.examId = examId;
        this.positionId = positionId;
        this.candidateId = candidateId;
    }
    
    @Override
    public String getEventType() {
        return "ApplicationSubmitted";
    }
    
    public ApplicationId getApplicationId() {
        return applicationId;
    }
    
    public ExamId getExamId() {
        return examId;
    }
    
    public PositionId getPositionId() {
        return positionId;
    }
    
    public CandidateId getCandidateId() {
        return candidateId;
    }
}
