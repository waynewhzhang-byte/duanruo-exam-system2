package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.ExamReviewerResponse;
import com.duanruo.exam.domain.review.ExamReviewerRepository;
import com.duanruo.exam.domain.review.ReviewStage;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 考试审核员应用服务
 */
@Service
@Transactional
public class ExamReviewerApplicationService {
    
    private final ExamReviewerRepository examReviewerRepository;
    private final UserRepository userRepository;
    
    public ExamReviewerApplicationService(ExamReviewerRepository examReviewerRepository,
                                         UserRepository userRepository) {
        this.examReviewerRepository = examReviewerRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * 获取考试的所有审核员（包括用户详细信息）
     */
    @Transactional(readOnly = true)
    public List<ExamReviewerResponse> getExamReviewers(UUID examId) {
        // 获取审核员关联信息
        List<ExamReviewerRepository.ExamReviewerInfo> reviewerInfos = 
            examReviewerRepository.findReviewerInfosByExam(examId);
        
        if (reviewerInfos.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 收集所有审核员ID
        List<UUID> reviewerIds = reviewerInfos.stream()
                .map(ExamReviewerRepository.ExamReviewerInfo::reviewerId)
                .distinct()
                .toList();
        
        // 批量获取用户信息
        Map<UUID, User> userMap = reviewerIds.stream()
                .map(id -> userRepository.findById(UserId.of(id)))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toMap(
                    user -> user.getId().getValue(),
                    user -> user
                ));
        
        // 组装响应
        return reviewerInfos.stream()
                .map(info -> {
                    User user = userMap.get(info.reviewerId());
                    if (user == null) {
                        return null;
                    }
                    
                    String role = info.stage() == ReviewStage.PRIMARY ? 
                        "PRIMARY_REVIEWER" : "SECONDARY_REVIEWER";
                    
                    return new ExamReviewerResponse(
                        info.id().toString(),
                        info.reviewerId().toString(),
                        user.getUsername(),
                        user.getEmail(),
                        role,
                        info.createdAt(),
                        null  // assignedBy 暂时为null，需要扩展数据库表才能存储
                    );
                })
                .filter(resp -> resp != null)
                .toList();
    }
    
    /**
     * 添加审核员
     */
    public void addReviewer(UUID examId, UUID reviewerId, String role) {
        ReviewStage stage = role.equals("PRIMARY_REVIEWER") ? 
            ReviewStage.PRIMARY : ReviewStage.SECONDARY;
        
        examReviewerRepository.add(examId, reviewerId, stage);
    }
    
    /**
     * 移除审核员
     */
    public void removeReviewer(UUID examId, UUID reviewerId, String role) {
        ReviewStage stage = role.equals("PRIMARY_REVIEWER") ? 
            ReviewStage.PRIMARY : ReviewStage.SECONDARY;
        
        examReviewerRepository.remove(examId, reviewerId, stage);
    }
    
    /**
     * 获取可用的审核员用户列表
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableReviewers() {
        List<User> reviewers = userRepository.findReviewers();

        return reviewers.stream()
                .map(user -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", user.getId().getValue().toString());
                    map.put("username", user.getUsername());
                    map.put("email", user.getEmail());
                    map.put("fullName", user.getFullName() != null ? user.getFullName() : "");
                    return map;
                })
                .collect(Collectors.toList());
    }
}

