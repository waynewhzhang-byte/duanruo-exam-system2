package com.duanruo.exam.domain.candidate;

import com.duanruo.exam.shared.exception.DomainException;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 候选人聚合根
 */
public class Candidate {
    
    private CandidateId id;
    private String userId; // 关联用户ID
    private String name;
    private String idNumber; // 身份证号（加密存储）
    private String phone; // 手机号（加密存储）
    private String email; // 邮箱（加密存储）
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private Candidate() {}
    
    /**
     * 创建新候选人
     */
    public static Candidate create(String userId, String name, String idNumber, String phone, String email) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new CandidateCreationException("USER_ID_REQUIRED", "用户ID不能为空");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new CandidateCreationException("NAME_REQUIRED", "姓名不能为空");
        }
        if (idNumber == null || idNumber.trim().isEmpty()) {
            throw new CandidateCreationException("ID_NUMBER_REQUIRED", "身份证号不能为空");
        }
        if (!isValidIdNumber(idNumber)) {
            throw new CandidateCreationException("INVALID_ID_NUMBER", "身份证号格式不正确");
        }
        if (phone != null && !isValidPhone(phone)) {
            throw new CandidateCreationException("INVALID_PHONE", "手机号格式不正确");
        }
        if (email != null && !isValidEmail(email)) {
            throw new CandidateCreationException("INVALID_EMAIL", "邮箱格式不正确");
        }
        
        Candidate candidate = new Candidate();
        candidate.id = CandidateId.newCandidateId();
        candidate.userId = userId.trim();
        candidate.name = name.trim();
        candidate.idNumber = idNumber.trim();
        candidate.phone = phone != null ? phone.trim() : null;
        candidate.email = email != null ? email.trim().toLowerCase() : null;
        candidate.createdAt = LocalDateTime.now();
        candidate.updatedAt = LocalDateTime.now();
        
        return candidate;
    }
    
    /**
     * 重建候选人（从持久化存储）
     */
    public static Candidate rebuild(CandidateId id, String userId, String name, String idNumber,
                                   String phone, String email, LocalDateTime createdAt,
                                   LocalDateTime updatedAt) {
        Candidate candidate = new Candidate();
        candidate.id = id;
        candidate.userId = userId;
        candidate.name = name;
        candidate.idNumber = idNumber;
        candidate.phone = phone;
        candidate.email = email;
        candidate.createdAt = createdAt;
        candidate.updatedAt = updatedAt;
        
        return candidate;
    }
    
    /**
     * 更新基本信息
     */
    public void updateBasicInfo(String name, String phone, String email) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name.trim();
        }
        if (phone != null) {
            if (!phone.trim().isEmpty() && !isValidPhone(phone)) {
                throw new CandidateOperationException("INVALID_PHONE", "手机号格式不正确");
            }
            this.phone = phone.trim().isEmpty() ? null : phone.trim();
        }
        if (email != null) {
            if (!email.trim().isEmpty() && !isValidEmail(email)) {
                throw new CandidateOperationException("INVALID_EMAIL", "邮箱格式不正确");
            }
            this.email = email.trim().isEmpty() ? null : email.trim().toLowerCase();
        }
        
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 验证身份证号格式
     */
    private static boolean isValidIdNumber(String idNumber) {
        if (idNumber == null || idNumber.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = idNumber.trim();
        // 简单的身份证号验证：18位数字，最后一位可能是X
        return trimmed.matches("^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$");
    }
    
    /**
     * 验证手机号格式
     */
    private static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = phone.trim();
        // 简单的手机号验证：11位数字，以1开头
        return trimmed.matches("^1[3-9]\\d{9}$");
    }
    
    /**
     * 验证邮箱格式
     */
    private static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = email.trim();
        // 简单的邮箱验证
        return trimmed.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    }
    
    /**
     * 获取脱敏后的身份证号
     */
    public String getMaskedIdNumber() {
        if (idNumber == null || idNumber.length() < 8) {
            return "****";
        }
        return idNumber.substring(0, 4) + "**********" + idNumber.substring(idNumber.length() - 4);
    }
    
    /**
     * 获取脱敏后的手机号
     */
    public String getMaskedPhone() {
        if (phone == null || phone.length() < 7) {
            return "****";
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
    
    /**
     * 获取脱敏后的邮箱
     */
    public String getMaskedEmail() {
        if (email == null || !email.contains("@")) {
            return "****";
        }
        String[] parts = email.split("@");
        String localPart = parts[0];
        String domainPart = parts[1];
        
        if (localPart.length() <= 2) {
            return "**@" + domainPart;
        }
        return localPart.substring(0, 2) + "****@" + domainPart;
    }
    
    // Getters
    public CandidateId getId() { return id; }
    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getIdNumber() { return idNumber; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Candidate candidate = (Candidate) o;
        return Objects.equals(id, candidate.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Candidate{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                ", name='" + name + '\'' +
                '}';
    }
    
    /**
     * 候选人创建异常
     */
    public static class CandidateCreationException extends DomainException {
        public CandidateCreationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
    
    /**
     * 候选人操作异常
     */
    public static class CandidateOperationException extends DomainException {
        public CandidateOperationException(String errorCode, String message) {
            super(errorCode, message);
        }
    }
}
