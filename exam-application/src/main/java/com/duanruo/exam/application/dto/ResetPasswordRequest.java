package com.duanruo.exam.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 重置密码请求DTO
 */
public class ResetPasswordRequest {
    
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 100, message = "新密码长度必须在6-100个字符之间")
    private String newPassword;
    
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;

    // 构造函数
    public ResetPasswordRequest() {}

    public ResetPasswordRequest(String username, String newPassword, String confirmPassword) {
        this.username = username;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }

    /**
     * 验证密码确认
     */
    public boolean isPasswordConfirmed() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

    @Override
    public String toString() {
        return "ResetPasswordRequest{" +
                "username='" + username + '\'' +
                ", newPassword='[PROTECTED]'" +
                ", confirmPassword='[PROTECTED]'" +
                '}';
    }
}
