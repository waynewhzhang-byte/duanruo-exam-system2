package com.duanruo.exam.infrastructure.adapter;

import com.duanruo.exam.domain.tenant.TenantBackup;
import com.duanruo.exam.domain.tenant.TenantBackupRepository;
import com.duanruo.exam.infrastructure.persistence.entity.TenantBackupEntity;
import com.duanruo.exam.infrastructure.persistence.repository.JpaTenantBackupRepository;
import com.duanruo.exam.shared.domain.TenantId;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 租户备份仓储实现
 */
@Component
public class TenantBackupRepositoryImpl implements TenantBackupRepository {
    
    private final JpaTenantBackupRepository jpaRepository;
    
    public TenantBackupRepositoryImpl(JpaTenantBackupRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }
    
    @Override
    public TenantBackup save(TenantBackup backup) {
        TenantBackupEntity entity = toEntity(backup);
        TenantBackupEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }
    
    @Override
    public Optional<TenantBackup> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }
    
    @Override
    public List<TenantBackup> findByTenantId(TenantId tenantId) {
        return jpaRepository.findByTenantIdOrderByStartedAtDesc(tenantId.getValue())
            .stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public Optional<TenantBackup> findLatestByTenantId(TenantId tenantId) {
        return jpaRepository.findFirstByTenantIdAndStatusOrderByStartedAtDesc(
            tenantId.getValue(), "COMPLETED"
        ).map(this::toDomain);
    }
    
    @Override
    public List<TenantBackup> findByTenantIdAndDateRange(TenantId tenantId, Instant startDate, Instant endDate) {
        return jpaRepository.findByTenantIdAndDateRange(tenantId.getValue(), startDate, endDate)
            .stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<TenantBackup> findExpiredBackups(Instant expirationDate) {
        return jpaRepository.findExpiredBackups(expirationDate)
            .stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public void delete(UUID id) {
        jpaRepository.deleteById(id);
    }
    
    @Override
    public long countByTenantId(TenantId tenantId) {
        return jpaRepository.countByTenantId(tenantId.getValue());
    }
    
    // 映射方法
    private TenantBackup toDomain(TenantBackupEntity entity) {
        TenantBackup.BackupMetadata metadata = new TenantBackup.BackupMetadata(
            entity.getTenantName(),
            entity.getSchemaName(),
            entity.getTableCount(),
            entity.getRecordCount(),
            entity.getDatabaseVersion(),
            entity.getApplicationVersion()
        );
        
        return TenantBackup.builder()
            .id(entity.getId())
            .tenantId(TenantId.of(entity.getTenantId()))
            .type(TenantBackup.BackupType.valueOf(entity.getBackupType()))
            .status(TenantBackup.BackupStatus.valueOf(entity.getStatus()))
            .backupPath(entity.getBackupPath())
            .backupSize(entity.getBackupSize())
            .checksum(entity.getChecksum())
            .startedAt(entity.getStartedAt())
            .completedAt(entity.getCompletedAt())
            .errorMessage(entity.getErrorMessage())
            .metadata(metadata)
            .build();
    }
    
    private TenantBackupEntity toEntity(TenantBackup backup) {
        TenantBackupEntity entity = new TenantBackupEntity();
        entity.setId(backup.getId());
        entity.setTenantId(backup.getTenantId().getValue());
        entity.setBackupType(backup.getType().name());
        entity.setStatus(backup.getStatus().name());
        entity.setBackupPath(backup.getBackupPath());
        entity.setBackupSize(backup.getBackupSize());
        entity.setChecksum(backup.getChecksum());
        entity.setStartedAt(backup.getStartedAt());
        entity.setCompletedAt(backup.getCompletedAt());
        entity.setErrorMessage(backup.getErrorMessage());
        
        if (backup.getMetadata() != null) {
            entity.setTenantName(backup.getMetadata().getTenantName());
            entity.setSchemaName(backup.getMetadata().getSchemaName());
            entity.setTableCount(backup.getMetadata().getTableCount());
            entity.setRecordCount(backup.getMetadata().getRecordCount());
            entity.setDatabaseVersion(backup.getMetadata().getDatabaseVersion());
            entity.setApplicationVersion(backup.getMetadata().getApplicationVersion());
        }
        
        return entity;
    }
}

