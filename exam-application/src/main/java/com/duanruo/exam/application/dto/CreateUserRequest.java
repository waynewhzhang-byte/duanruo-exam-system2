package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * 创建用户请求DTO
 * 用于SUPER_ADMIN创建用户（包括TENANT_ADMIN）
 */
public class CreateUserRequest {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度必须在6-100个字符之间")
    private String password;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @NotBlank(message = "姓名不能为空")
    @Size(min = 2, max = 50, message = "姓名长度必须在2-50个字符之间")
    private String fullName;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phoneNumber;
    
    private String department;
    
    private String jobTitle;
    
    /**
     * 全局角色（SUPER_ADMIN, CANDIDATE等）
     * 如果不指定，默认为CANDIDATE
     */
    private Set<Role> globalRoles;

    /**
     * 租户ID（可选）
     * 如果指定，将同时创建UserTenantRole关联
     */
    private String tenantId;

    /**
     * 租户角色（可选）
     * 如果指定了tenantId，可以同时指定租户角色
     */
    private Role tenantRole;

    // 构造函数
    public CreateUserRequest() {}

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public Set<Role> getGlobalRoles() {
        return globalRoles;
    }

    public void setGlobalRoles(Set<Role> globalRoles) {
        this.globalRoles = globalRoles;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Role getTenantRole() {
        return tenantRole;
    }

    public void setTenantRole(Role tenantRole) {
        this.tenantRole = tenantRole;
    }

    @Override
    public String toString() {
        return "CreateUserRequest{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", department='" + department + '\'' +
                ", jobTitle='" + jobTitle + '\'' +
                ", globalRoles=" + globalRoles +
                ", tenantId='" + tenantId + '\'' +
                ", tenantRole=" + tenantRole +
                '}';
    }
}

