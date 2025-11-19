package com.duanruo.exam.domain.tenant;

import com.duanruo.exam.shared.domain.TenantId;

import java.util.List;
import java.util.Optional;

/**
 * 租户仓储接口
 */
public interface TenantRepository {
    
    /**
     * 保存租户
     */
    void save(Tenant tenant);
    
    /**
     * 根据ID查找租户
     */
    Optional<Tenant> findById(TenantId id);
    
    /**
     * 根据租户代码查找租户
     */
    Optional<Tenant> findByCode(String code);
    
    /**
     * 根据Schema名称查找租户
     */
    Optional<Tenant> findBySchemaName(String schemaName);
    
    /**
     * 查找所有激活的租户
     */
    List<Tenant> findAllActive();
    
    /**
     * 查找所有租户
     */
    List<Tenant> findAll();
    
    /**
     * 检查租户代码是否存在
     */
    boolean existsByCode(String code);
    
    /**
     * 删除租户
     */
    void delete(TenantId id);
}

