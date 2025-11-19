package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.TenantBackupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 租户备份JPA仓储
 */
@Repository
public interface JpaTenantBackupRepository extends JpaRepository<TenantBackupEntity, UUID> {
    
    /**
     * 查找租户的所有备份
     */
    List<TenantBackupEntity> findByTenantIdOrderByStartedAtDesc(UUID tenantId);
    
    /**
     * 查找租户的最新备份
     */
    Optional<TenantBackupEntity> findFirstByTenantIdAndStatusOrderByStartedAtDesc(
        UUID tenantId, String status
    );
    
    /**
     * 查找指定时间范围内的备份
     */
    @Query("SELECT b FROM TenantBackupEntity b WHERE b.tenantId = :tenantId " +
           "AND b.startedAt >= :startDate AND b.startedAt <= :endDate " +
           "ORDER BY b.startedAt DESC")
    List<TenantBackupEntity> findByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate
    );
    
    /**
     * 查找所有过期的备份
     */
    @Query("SELECT b FROM TenantBackupEntity b WHERE b.status = 'COMPLETED' " +
           "AND b.completedAt < :expirationDate")
    List<TenantBackupEntity> findExpiredBackups(@Param("expirationDate") Instant expirationDate);
    
    /**
     * 统计租户的备份数量
     */
    long countByTenantId(UUID tenantId);
    
    /**
     * 统计租户指定状态的备份数量
     */
    long countByTenantIdAndStatus(UUID tenantId, String status);
}

