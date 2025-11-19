package com.duanruo.exam.application.dto;

import java.time.LocalDateTime;

/**
 * 考试审核员响应DTO
 */
public class ExamReviewerResponse {
    
    private String id;
    private String userId;
    private String username;
    private String email;
    private String role;  // PRIMARY_REVIEWER or SECONDARY_REVIEWER
    private LocalDateTime assignedAt;
    private String assignedBy;
    
    public ExamReviewerResponse() {}
    
    public ExamReviewerResponse(String id, String userId, String username, String email, 
                               String role, LocalDateTime assignedAt, String assignedBy) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.assignedAt = assignedAt;
        this.assignedBy = assignedBy;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
}

