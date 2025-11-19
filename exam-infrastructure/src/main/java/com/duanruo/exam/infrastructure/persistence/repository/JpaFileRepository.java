package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.FileEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 文件JPA仓储接口
 */
@Repository
public interface JpaFileRepository extends JpaRepository<FileEntity, UUID> {

    /**
     * 根据对象键查找文件
     */
    Optional<FileEntity> findByObjectKey(String objectKey);

    /**
     * 根据存储名称查找文件
     */
    Optional<FileEntity> findByStoredName(String storedName);

    /**
     * 根据上传者查找文件
     */
    Page<FileEntity> findByUploadedBy(String uploadedBy, Pageable pageable);

    /**
     * 根据上传者和状态查找文件
     */
    Page<FileEntity> findByUploadedByAndStatus(String uploadedBy, FileEntity.FileStatus status, Pageable pageable);

    /**
     * 根据申请ID查找文件
     */
    List<FileEntity> findByApplicationId(UUID applicationId);

    /**
     * 根据申请ID和字段键查找文件
     */
    List<FileEntity> findByApplicationIdAndFieldKey(UUID applicationId, String fieldKey);

    /**
     * 根据状态查找文件
     */
    List<FileEntity> findByStatus(FileEntity.FileStatus status);

    /**
     * 根据病毒扫描状态查找文件
     */
    List<FileEntity> findByVirusScanStatus(FileEntity.VirusScanStatus virusScanStatus);

    /**
     * 查找过期文件
     */
    @Query("SELECT f FROM FileEntity f WHERE f.expiresAt IS NOT NULL AND f.expiresAt < :now")
    List<FileEntity> findExpiredFiles(@Param("now") LocalDateTime now);

    /**
     * 查找需要病毒扫描的文件
     */
    @Query("SELECT f FROM FileEntity f WHERE f.virusScanStatus = 'PENDING' AND f.status = 'UPLOADED' ORDER BY f.createdAt ASC")
    List<FileEntity> findFilesNeedingVirusScan();

    /**
     * 统计用户文件数量
     */
    long countByUploadedBy(String uploadedBy);

    /**
     * 统计用户文件总大小
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileEntity f WHERE f.uploadedBy = :uploadedBy AND f.status != 'DELETED'")
    Long sumFileSizeByUploadedBy(@Param("uploadedBy") String uploadedBy);

    /**
     * 更新文件访问信息
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.accessCount = f.accessCount + 1, f.lastAccessedAt = :accessTime WHERE f.id = :fileId")
    void updateAccessInfo(@Param("fileId") UUID fileId, @Param("accessTime") LocalDateTime accessTime);

    /**
     * 批量更新文件状态
     */
    @Modifying
    @Query("UPDATE FileEntity f SET f.status = :status WHERE f.id IN :fileIds")
    void updateStatusBatch(@Param("fileIds") List<UUID> fileIds, @Param("status") FileEntity.FileStatus status);

    /**
     * 删除过期文件
     */
    @Modifying
    @Query("DELETE FROM FileEntity f WHERE f.expiresAt IS NOT NULL AND f.expiresAt < :now")
    int deleteExpiredFiles(@Param("now") LocalDateTime now);

    /**
     * 查找孤儿文件（没有关联申请的文件）
     */
    @Query("SELECT f FROM FileEntity f WHERE f.applicationId IS NULL AND f.createdAt < :cutoffTime")
    List<FileEntity> findOrphanFiles(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 根据文件类型统计
     */
    @Query("SELECT f.contentType, COUNT(f) FROM FileEntity f WHERE f.status != 'DELETED' GROUP BY f.contentType")
    List<Object[]> countByContentType();

    /**
     * 查找大文件
     */
    @Query("SELECT f FROM FileEntity f WHERE f.fileSize > :sizeThreshold ORDER BY f.fileSize DESC")
    List<FileEntity> findLargeFiles(@Param("sizeThreshold") Long sizeThreshold);
}
