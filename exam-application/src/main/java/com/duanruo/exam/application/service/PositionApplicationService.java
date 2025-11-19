package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.PositionResponse;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.shared.exception.ApplicationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@Transactional
public class PositionApplicationService {

    private final PositionRepository positionRepository;
    private final SubjectRepository subjectRepository;
    private final ApplicationRepository applicationRepository;

    public PositionApplicationService(PositionRepository positionRepository,
                                      SubjectRepository subjectRepository,
                                      ApplicationRepository applicationRepository) {
        this.positionRepository = positionRepository;
        this.subjectRepository = subjectRepository;
        this.applicationRepository = applicationRepository;
    }

    public PositionResponse createPosition(UUID examId, String code, String title,
                                           String description, String requirements, Integer quota) {
        Position p = Position.create(ExamId.of(examId), code, title);
        p.updateInfo(title, description, requirements);
        p.setQuota(quota);
        positionRepository.save(p);
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public PositionResponse getPositionById(UUID id) {
        Position p = positionRepository.findById(PositionId.of(id))
                .orElseThrow(() -> new ApplicationException("POSITION_NOT_FOUND", "岗位不存在"));
        return toResponse(p);
    }

    public PositionResponse updatePosition(UUID id, String title, String description,
                                           String requirements, Integer quota) {
        Position p = positionRepository.findById(PositionId.of(id))
                .orElseThrow(() -> new ApplicationException("POSITION_NOT_FOUND", "岗位不存在"));

        // 检查是否有已提交的报名
        if (applicationRepository.hasSubmittedApplications(p.getId())) {
            throw new ApplicationException("POSITION_LOCKED",
                "该岗位已有报名提交，无法修改岗位信息");
        }

        p.updateInfo(title, description, requirements);
        p.setQuota(quota);
        positionRepository.save(p);
        return toResponse(p);
    }

    public void deletePosition(UUID id) {
        PositionId positionId = PositionId.of(id);

        // 检查是否有已提交的报名
        if (applicationRepository.hasSubmittedApplications(positionId)) {
            throw new ApplicationException("POSITION_LOCKED",
                "该岗位已有报名提交，无法删除");
        }

        positionRepository.delete(positionId);
    }

    @Transactional(readOnly = true)
    public List<PositionResponse> listSubjectsPositions(UUID examId) {
        return positionRepository.findByExamId(ExamId.of(examId)).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Subject> getPositionSubjects(UUID positionId) {
        return subjectRepository.findByPositionId(PositionId.of(positionId));
    }

    public Subject createSubject(UUID positionId, String name, Integer duration, SubjectType type,
                                 java.math.BigDecimal maxScore, java.math.BigDecimal passingScore,
                                 java.math.BigDecimal weight, Integer ordering, String schedule) {
        Subject s = Subject.create(PositionId.of(positionId), name, duration, type);
        if (maxScore != null) s.setMaxScore(maxScore);
        if (passingScore != null) s.setPassingScore(passingScore);
        if (weight != null) s.setWeight(weight);
        if (ordering != null) s.setOrdering(ordering);
        if (schedule != null) s.setSchedule(schedule);
        subjectRepository.save(s);
        return s;
    }

    public Subject updateSubject(UUID subjectId, String name, Integer duration, SubjectType type,
                                 java.math.BigDecimal maxScore, java.math.BigDecimal passingScore,
                                 java.math.BigDecimal weight, Integer ordering, String schedule) {
        Subject s = subjectRepository.findById(SubjectId.of(subjectId))
                .orElseThrow(() -> new ApplicationException("SUBJECT_NOT_FOUND", "科目不存在"));
        if (name != null || duration != null) s.updateInfo(name, duration);
        if (type != null) s.setType(type);
        if (maxScore != null) s.setMaxScore(maxScore);
        if (passingScore != null) s.setPassingScore(passingScore);
        if (weight != null) s.setWeight(weight);
        if (ordering != null) s.setOrdering(ordering);
        if (schedule != null) s.setSchedule(schedule);
        subjectRepository.save(s);
        return s;
    }

    public void deleteSubject(UUID subjectId) {
        subjectRepository.delete(SubjectId.of(subjectId));
    }

    private PositionResponse toResponse(Position position) {
        return PositionResponse.builder()
                .id(position.getId().toString())
                .examId(position.getExamId().toString())
                .code(position.getCode())
                .title(position.getTitle())
                .description(position.getDescription())
                .requirements(position.getRequirements())
                .quota(position.getQuota())
                .build();
    }
}

