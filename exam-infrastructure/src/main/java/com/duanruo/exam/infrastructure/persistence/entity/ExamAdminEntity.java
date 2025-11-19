package com.duanruo.exam.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 考试管理员关联实体
 * 管理考试与管理员的多对多关系
 */
@Entity
@Table(name = "exam_admins",
        uniqueConstraints = @UniqueConstraint(name = "uq_exam_admin", 
                                            columnNames = {"exam_id", "admin_id"}),
        indexes = {
                @Index(name = "idx_exam_admins_exam_id", columnList = "exam_id"),
                @Index(name = "idx_exam_admins_admin_id", columnList = "admin_id"),
                @Index(name = "idx_exam_admins_created_by", columnList = "created_by")
        })
public class ExamAdminEntity {

    @Id
    private UUID id;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /**
     * 管理员在该考试中的具体权限配置
     * 例如: {"canManageScores": true, "canManageVenues": true}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "permissions", columnDefinition = "jsonb")
    private Map<String, Object> permissions;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 默认构造函数
    public ExamAdminEntity() {
        this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 构造函数
    public ExamAdminEntity(UUID examId, UUID adminId, Map<String, Object> permissions, UUID createdBy) {
        this();
        this.examId = examId;
        this.adminId = adminId;
        this.permissions = permissions;
        this.createdBy = createdBy;
    }

    // JPA生命周期回调
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getExamId() {
        return examId;
    }

    public void setExamId(UUID examId) {
        this.examId = examId;
    }

    public UUID getAdminId() {
        return adminId;
    }

    public void setAdminId(UUID adminId) {
        this.adminId = adminId;
    }

    public Map<String, Object> getPermissions() {
        return permissions;
    }

    public void setPermissions(Map<String, Object> permissions) {
        this.permissions = permissions;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExamAdminEntity that)) return false;
        return examId.equals(that.examId) && adminId.equals(that.adminId);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(examId, adminId);
    }

    @Override
    public String toString() {
        return "ExamAdminEntity{" +
                "id=" + id +
                ", examId=" + examId +
                ", adminId=" + adminId +
                ", permissions=" + permissions +
                ", createdBy=" + createdBy +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
