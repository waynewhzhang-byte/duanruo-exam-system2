package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.Role;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户响应DTO
 */
public class UserResponse {
    
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String status;
    private List<String> roles;
    private List<String> permissions;
    private LocalDateTime lastLoginAt;
    private boolean emailVerified;
    private boolean phoneVerified;
    private String department;
    private String jobTitle;
    private LocalDateTime createdAt;

    // 构造函数
    public UserResponse() {}

    // 从User实体创建响应DTO
    public static UserResponse fromUser(User user) {
        UserResponse response = new UserResponse();
        response.id = user.getId().toString();
        response.username = user.getUsername();
        response.email = user.getEmail();
        response.fullName = user.getFullName();
        response.phoneNumber = user.getPhoneNumber();
        response.status = user.getStatus().name();
        response.roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        response.permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Enum::name)
                .distinct()
                .collect(Collectors.toList());
        response.lastLoginAt = user.getLastLoginAt();
        response.emailVerified = user.isEmailVerified();
        response.phoneVerified = user.isPhoneVerified();
        response.department = user.getDepartment();
        response.jobTitle = user.getJobTitle();
        response.createdAt = user.getCreatedAt();
        return response;
    }

    // Builder模式
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UserResponse response = new UserResponse();

        public Builder id(String id) {
            response.id = id;
            return this;
        }

        public Builder username(String username) {
            response.username = username;
            return this;
        }

        public Builder email(String email) {
            response.email = email;
            return this;
        }

        public Builder fullName(String fullName) {
            response.fullName = fullName;
            return this;
        }

        public Builder phoneNumber(String phoneNumber) {
            response.phoneNumber = phoneNumber;
            return this;
        }

        public Builder status(String status) {
            response.status = status;
            return this;
        }

        public Builder roles(List<String> roles) {
            response.roles = roles;
            return this;
        }

        public Builder permissions(List<String> permissions) {
            response.permissions = permissions;
            return this;
        }

        public Builder lastLoginAt(LocalDateTime lastLoginAt) {
            response.lastLoginAt = lastLoginAt;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            response.emailVerified = emailVerified;
            return this;
        }

        public Builder phoneVerified(boolean phoneVerified) {
            response.phoneVerified = phoneVerified;
            return this;
        }

        public Builder department(String department) {
            response.department = department;
            return this;
        }

        public Builder jobTitle(String jobTitle) {
            response.jobTitle = jobTitle;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            response.createdAt = createdAt;
            return this;
        }

        public UserResponse build() {
            return response;
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "UserResponse{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", status='" + status + '\'' +
                ", roles=" + roles +
                '}';
    }
}
