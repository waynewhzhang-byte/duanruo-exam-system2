package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.tenant.TenantStatus;
import com.duanruo.exam.infrastructure.persistence.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 租户Spring Data JPA Repository
 */
@Repository
public interface JpaTenantRepository extends JpaRepository<TenantEntity, UUID> {
    
    /**
     * 根据租户代码查找
     */
    Optional<TenantEntity> findByCode(String code);
    
    /**
     * 根据Schema名称查找
     */
    Optional<TenantEntity> findBySchemaName(String schemaName);
    
    /**
     * 查找所有激活的租户
     */
    List<TenantEntity> findAllByStatus(TenantStatus status);
    
    /**
     * 检查租户代码是否存在
     */
    boolean existsByCode(String code);
    
    /**
     * 检查Schema名称是否存在
     */
    boolean existsBySchemaName(String schemaName);
    
    /**
     * 查找所有激活的租户（优化查询）
     */
    @Query("SELECT t FROM TenantEntity t WHERE t.status = 'ACTIVE' ORDER BY t.createdAt DESC")
    List<TenantEntity> findAllActiveTenants();
}

