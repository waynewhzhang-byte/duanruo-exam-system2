package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.constants.ApiConstants;
import com.duanruo.exam.application.service.ExamPermissionService;
import com.duanruo.exam.domain.admin.ExamAdminRepository;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.user.UserId;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 考试管理员管理控制器
 * 提供考试管理员分配、移除等API
 */
@RestController
@RequestMapping("/exam-admins")
public class ExamAdminController {

    private final ExamPermissionService examPermissionService;
    private final ExamAdminRepository examAdminRepository;

    public ExamAdminController(ExamPermissionService examPermissionService,
                              ExamAdminRepository examAdminRepository) {
        this.examPermissionService = examPermissionService;
        this.examAdminRepository = examAdminRepository;
    }

    /**
     * 分配考试管理员
     */
    @PostMapping("/assign")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, String>> assignExamAdmin(@Valid @RequestBody AssignExamAdminRequest request,
                                                              @CurrentUserId UUID operatorId) {
        
        examPermissionService.assignExamAdmin(
            ExamId.of(request.examId()),
            UserId.of(request.adminId()),
            request.permissions(),
            UserId.of(operatorId)
        );
        
        return ResponseEntity.ok(Map.of("message", "考试管理员分配成功"));
    }

    /**
     * 移除考试管理员
     */
    @DeleteMapping("/remove")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, String>> removeExamAdmin(@Valid @RequestBody RemoveExamAdminRequest request,
                                                              @CurrentUserId UUID operatorId) {
        
        examPermissionService.removeExamAdmin(
            ExamId.of(request.examId()),
            UserId.of(request.adminId()),
            UserId.of(operatorId)
        );
        
        return ResponseEntity.ok(Map.of("message", "考试管理员移除成功"));
    }

    /**
     * 查询考试的所有管理员
     */
    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<List<UUID>> getExamAdmins(@PathVariable UUID examId) {
        List<UserId> adminIds = examAdminRepository.findAdminIdsByExam(ExamId.of(examId));
        List<UUID> adminUuids = adminIds.stream()
                .map(UserId::getValue)
                .toList();
        
        return ResponseEntity.ok(adminUuids);
    }

    /**
     * 查询用户管理的所有考试
     */
    @GetMapping("/user/{userId}/exams")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<List<UUID>> getUserManagedExams(@PathVariable UUID userId,
                                                         @CurrentUserId UUID requesterId) {
        // 检查权限：只能查询自己管理的考试，或者超级管理员可以查询任何人的
        if (!requesterId.equals(userId)) {
            // 检查是否是超级管理员 - 暂时允许所有管理员查询
            // 后续可以通过 examPermissionService.hasPermission() 进行更细粒度的权限控制
        }
        
        List<ExamId> examIds = examAdminRepository.findExamIdsByAdmin(UserId.of(userId));
        List<UUID> examUuids = examIds.stream()
                .map(ExamId::getValue)
                .toList();
        
        return ResponseEntity.ok(examUuids);
    }

    /**
     * 查询当前用户管理的考试
     */
    @GetMapping("/my-exams")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<List<UUID>> getMyManagedExams(@CurrentUserId UUID userId) {
        
        List<ExamId> examIds = examAdminRepository.findExamIdsByAdmin(UserId.of(userId));
        List<UUID> examUuids = examIds.stream()
                .map(ExamId::getValue)
                .toList();
        
        return ResponseEntity.ok(examUuids);
    }

    /**
     * 检查用户是否是指定考试的管理员
     */
    @GetMapping("/check/{examId}/{userId}")
    @PreAuthorize("hasAuthority('EXAM_VIEW')")
    public ResponseEntity<Map<String, Boolean>> checkExamAdmin(@PathVariable UUID examId,
                                                              @PathVariable UUID userId) {
        boolean isAdmin = examAdminRepository.exists(ExamId.of(examId), UserId.of(userId));
        
        return ResponseEntity.ok(Map.of("isExamAdmin", isAdmin));
    }

    /**
     * 更新考试管理员权限
     */
    @PutMapping("/permissions")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, String>> updateExamAdminPermissions(
            @Valid @RequestBody UpdateExamAdminPermissionsRequest request) {
        
        examAdminRepository.updatePermissions(
            ExamId.of(request.examId()),
            UserId.of(request.adminId()),
            request.permissions()
        );
        
        return ResponseEntity.ok(Map.of("message", "权限更新成功"));
    }

    /**
     * 批量分配考试管理员
     */
    @PostMapping("/batch-assign")
    @PreAuthorize("hasAuthority('EXAM_ADMIN_MANAGE')")
    public ResponseEntity<Map<String, Object>> batchAssignExamAdmins(
            @Valid @RequestBody BatchAssignExamAdminRequest request,
            @CurrentUserId UUID operatorId) {
        List<UserId> adminIds = request.adminIds().stream()
                .map(UserId::of)
                .toList();
        
        examAdminRepository.addBatch(
            ExamId.of(request.examId()),
            adminIds,
            request.permissions(),
            UserId.of(operatorId)
        );
        
        return ResponseEntity.ok(Map.of(
            ApiConstants.KEY_MESSAGE, ApiConstants.MSG_BATCH_ASSIGN_SUCCESS,
            "assignedCount", adminIds.size()
        ));
    }

    // DTO类定义
    public record AssignExamAdminRequest(
            UUID examId,
            UUID adminId,
            Map<String, Object> permissions
    ) {}

    public record RemoveExamAdminRequest(
            UUID examId,
            UUID adminId
    ) {}

    public record UpdateExamAdminPermissionsRequest(
            UUID examId,
            UUID adminId,
            Map<String, Object> permissions
    ) {}

    public record BatchAssignExamAdminRequest(
            UUID examId,
            List<UUID> adminIds,
            Map<String, Object> permissions
    ) {}
}
