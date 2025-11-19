package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.domain.tenant.TenantStatus;
import com.duanruo.exam.infrastructure.persistence.mapper.TenantMapper;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 租户仓储实现
 */
@Repository
public class TenantRepositoryImpl implements TenantRepository {
    
    private final JpaTenantRepository jpaRepository;
    private final TenantMapper mapper;
    
    public TenantRepositoryImpl(JpaTenantRepository jpaRepository, TenantMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    
    @Override
    @Transactional
    public void save(Tenant tenant) {
        var entity = mapper.toEntity(tenant);
        jpaRepository.save(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Tenant> findById(TenantId id) {
        return jpaRepository.findById(id.getValue())
            .map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Tenant> findByCode(String code) {
        return jpaRepository.findByCode(code)
            .map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Tenant> findBySchemaName(String schemaName) {
        return jpaRepository.findBySchemaName(schemaName)
            .map(mapper::toDomain);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> findAllActive() {
        return jpaRepository.findAllByStatus(TenantStatus.ACTIVE)
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Tenant> findAll() {
        return jpaRepository.findAll()
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByCode(String code) {
        return jpaRepository.existsByCode(code);
    }
    
    @Override
    @Transactional
    public void delete(TenantId id) {
        jpaRepository.deleteById(id.getValue());
    }
}

