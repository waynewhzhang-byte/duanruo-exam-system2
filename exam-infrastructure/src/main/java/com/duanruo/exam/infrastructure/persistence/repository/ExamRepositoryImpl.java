package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.*;
import com.duanruo.exam.domain.tenant.Tenant;
import com.duanruo.exam.domain.tenant.TenantRepository;
import com.duanruo.exam.infrastructure.persistence.entity.ExamEntity;
import com.duanruo.exam.infrastructure.persistence.entity.PositionEntity;
import com.duanruo.exam.infrastructure.persistence.mapper.ExamMapper;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 考试仓储实现
 */
@Repository
public class ExamRepositoryImpl implements ExamRepository {

    private final JpaExamRepository jpaExamRepository;
    private final JpaPositionRepository jpaPositionRepository;
    private final ExamMapper examMapper;
    private final TenantRepository tenantRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    public ExamRepositoryImpl(JpaExamRepository jpaExamRepository,
                             JpaPositionRepository jpaPositionRepository,
                             ExamMapper examMapper,
                             TenantRepository tenantRepository) {
        this.jpaExamRepository = jpaExamRepository;
        this.jpaPositionRepository = jpaPositionRepository;
        this.examMapper = examMapper;
        this.tenantRepository = tenantRepository;
    }

    @Override
    public void save(Exam exam) {
        ExamEntity entity = examMapper.toEntity(exam);
        // 立刻刷新到数据库，尽早暴露唯一约束等异常，便于全局异常处理捕获
        jpaExamRepository.saveAndFlush(entity);
    }

    @Override
    public Optional<Exam> findById(ExamId id) {
        Optional<ExamEntity> entityOpt = jpaExamRepository.findById(id.getValue());
        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        ExamEntity entity = entityOpt.get();
        
        // 加载岗位信息
        List<PositionEntity> positionEntities = jpaPositionRepository.findByExamId(id.getValue());
        
        return Optional.of(examMapper.toDomain(entity, positionEntities));
    }

    @Override
    public Optional<Exam> findByCode(String code) {
        Optional<ExamEntity> entityOpt = jpaExamRepository.findByCode(code);
        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        ExamEntity entity = entityOpt.get();
        List<PositionEntity> positionEntities = jpaPositionRepository.findByExamId(entity.getId());

        return Optional.of(examMapper.toDomain(entity, positionEntities));
    }

    @Override
    public List<Exam> findAll() {
        List<ExamEntity> entities = jpaExamRepository.findAll();
        return entities.stream()
                .map(entity -> {
                    List<PositionEntity> positionEntities = jpaPositionRepository.findByExamId(entity.getId());
                    return examMapper.toDomain(entity, positionEntities);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Exam> findByStatus(ExamStatus status) {
        ExamEntity.ExamStatusEntity statusEntity = mapToEntityStatus(status);
        List<ExamEntity> entities = jpaExamRepository.findByStatus(statusEntity);
        
        return entities.stream()
                .map(entity -> {
                    List<PositionEntity> positionEntities = jpaPositionRepository.findByExamId(entity.getId());
                    return examMapper.toDomain(entity, positionEntities);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<Exam> findByStatusAcrossAllTenants(ExamStatus status) {
        // 获取所有激活的租户
        List<Tenant> tenants = tenantRepository.findAllActive();
        
        if (tenants.isEmpty()) {
            System.out.println("=== No active tenants found ===");
            return new ArrayList<>();
        }
        
        System.out.println("=== findByStatusAcrossAllTenants: Found " + tenants.size() + " active tenants ===");
        
        // 构建UNION ALL查询，一次性查询所有租户的公开考试
        // 按照exams表的实际字段顺序：id, code, title, description, announcement, registration_start, registration_end, 
        // fee_required, fee_amount, ticket_template, status, created_by, created_at, updated_at, exam_start, exam_end, form_template
        StringBuilder sqlBuilder = new StringBuilder();
        ExamEntity.ExamStatusEntity statusEntity = mapToEntityStatus(status);
        
        for (int i = 0; i < tenants.size(); i++) {
            Tenant tenant = tenants.get(i);
            // 将连字符替换为下划线，因为PostgreSQL schema名称不支持连字符
            String schemaName = "tenant_" + tenant.getCode().replace("-", "_");
            
            if (i > 0) {
                sqlBuilder.append(" UNION ALL ");
            }
            
            // 查询该租户schema中的公开考试，只选择需要的字段
            sqlBuilder.append(String.format(
                "SELECT e.id, e.code, e.title, e.description, e.announcement, " +
                "e.registration_start, e.registration_end, e.fee_required, e.fee_amount, " +
                "e.status, e.created_by, e.created_at, e.updated_at, e.exam_start, e.exam_end " +
                "FROM %s.exams e WHERE e.status = '%s'",
                schemaName,
                statusEntity.name()
            ));
        }
        
        String sql = sqlBuilder.toString();
        System.out.println("=== Executing UNION ALL query across " + tenants.size() + " tenants ===");
        
        try {
            // 执行原生SQL查询
            @SuppressWarnings("unchecked")
            List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();
            
            System.out.println("=== Found " + results.size() + " exams across all tenants ===");
            
            List<Exam> allExams = new ArrayList<>();
            
            for (Object[] row : results) {
                try {
                    // 按照SELECT的字段顺序映射
                    ExamEntity examEntity = new ExamEntity();
                    examEntity.setId((java.util.UUID) row[0]); // id
                    examEntity.setCode((String) row[1]); // code
                    examEntity.setTitle((String) row[2]); // title
                    examEntity.setDescription((String) row[3]); // description
                    examEntity.setAnnouncement((String) row[4]); // announcement
                    
                    // 处理日期时间字段
                    if (row[5] != null) {
                        examEntity.setRegistrationStart(((java.sql.Timestamp) row[5]).toLocalDateTime());
                    }
                    if (row[6] != null) {
                        examEntity.setRegistrationEnd(((java.sql.Timestamp) row[6]).toLocalDateTime());
                    }
                    
                    // 处理费用字段
                    examEntity.setFeeRequired((Boolean) row[7]); // fee_required
                    if (row[8] != null) {
                        examEntity.setFeeAmount(new java.math.BigDecimal(row[8].toString())); // fee_amount
                    }
                    
                    examEntity.setStatus(ExamEntity.ExamStatusEntity.valueOf((String) row[9])); // status
                    
                    if (row[10] != null) {
                        examEntity.setCreatedBy((java.util.UUID) row[10]); // created_by
                    }
                    if (row[11] != null) {
                        examEntity.setCreatedAt(((java.sql.Timestamp) row[11]).toLocalDateTime());
                    }
                    if (row[12] != null) {
                        examEntity.setUpdatedAt(((java.sql.Timestamp) row[12]).toLocalDateTime());
                    }
                    if (row[13] != null) {
                        examEntity.setExamStart(((java.sql.Timestamp) row[13]).toLocalDateTime());
                    }
                    if (row[14] != null) {
                        examEntity.setExamEnd(((java.sql.Timestamp) row[14]).toLocalDateTime());
                    }
                    
                    // 暂时不查询positions，避免复杂的映射
                    List<PositionEntity> positionEntities = new ArrayList<>();
                    
                    // 转换为领域对象
                    Exam exam = examMapper.toDomain(examEntity, positionEntities);
                    allExams.add(exam);
                    
                    System.out.println("=== Loaded exam: " + exam.getTitle() + " (ID: " + exam.getId() + ") ===");
                    
                } catch (Exception e) {
                    System.err.println("!!! Error mapping exam result: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            System.out.println("=== Successfully loaded " + allExams.size() + " exams ===");
            return allExams;
            
        } catch (Exception e) {
            System.err.println("!!! Error executing cross-tenant query: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public boolean existsByCode(String code) {
        return jpaExamRepository.existsByCode(code);
    }

    @Override
    public void delete(ExamId id) {
        jpaExamRepository.deleteById(id.getValue());
    }

    /**
     * 映射领域状态到实体状态
     */
    private ExamEntity.ExamStatusEntity mapToEntityStatus(ExamStatus status) {
        return switch (status) {
            case DRAFT -> ExamEntity.ExamStatusEntity.DRAFT;
            case OPEN -> ExamEntity.ExamStatusEntity.OPEN;
            case CLOSED -> ExamEntity.ExamStatusEntity.CLOSED;
            case IN_PROGRESS -> ExamEntity.ExamStatusEntity.IN_PROGRESS;
            case COMPLETED -> ExamEntity.ExamStatusEntity.COMPLETED;
        };
    }
}
