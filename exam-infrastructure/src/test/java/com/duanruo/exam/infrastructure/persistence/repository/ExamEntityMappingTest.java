package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ExamEntity;
import com.duanruo.exam.infrastructure.persistence.entity.ExamAdminEntity;
import com.duanruo.exam.infrastructure.persistence.entity.ExamScoreEntity;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA实体映射完整性测试
 * 验证V008迁移后的实体映射是否正确
 *
 * 注意：这些测试在H2数据库上运行时会失败，因为H2不完全兼容PostgreSQL的DDL语法。
 * 这些测试主要用于在实际的PostgreSQL数据库上验证Flyway迁移。
 * 在CI/CD环境中，应该使用Testcontainers运行真实的PostgreSQL数据库。
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=true",
    "spring.flyway.enabled=false",
    "spring.jpa.properties.hibernate.default_schema="
})
@Disabled("H2数据库不完全兼容PostgreSQL DDL语法，需要使用Testcontainers运行真实PostgreSQL")
public class ExamEntityMappingTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    public void testExamEntityWithSlugMapping() {
        // 创建考试实体，包含slug字段
        ExamEntity exam = new ExamEntity();
        exam.setId(UUID.randomUUID());
        exam.setCode("TEST2024");
        exam.setSlug("test-2024");
        exam.setTitle("测试考试");
        exam.setDescription("测试描述");
        exam.setStatus(ExamEntity.ExamStatusEntity.DRAFT);
        exam.setFeeRequired(false);
        exam.setCreatedBy(UUID.randomUUID());

        // 保存并刷新
        ExamEntity savedExam = entityManager.persistAndFlush(exam);
        entityManager.clear();

        // 重新查询验证
        ExamEntity foundExam = entityManager.find(ExamEntity.class, savedExam.getId());
        
        assertThat(foundExam).isNotNull();
        assertThat(foundExam.getSlug()).isEqualTo("test-2024");
        assertThat(foundExam.getCode()).isEqualTo("TEST2024");
        assertThat(foundExam.getTitle()).isEqualTo("测试考试");
    }

    @Test
    public void testExamAdminEntityMapping() {
        // 创建考试管理员实体
        ExamAdminEntity examAdmin = new ExamAdminEntity();
        examAdmin.setId(UUID.randomUUID());
        examAdmin.setExamId(UUID.randomUUID());
        examAdmin.setAdminId(UUID.randomUUID());
        
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("canManageScores", true);
        permissions.put("canManageVenues", true);
        examAdmin.setPermissions(permissions);
        
        examAdmin.setCreatedBy(UUID.randomUUID());
        examAdmin.setCreatedAt(LocalDateTime.now());
        examAdmin.setUpdatedAt(LocalDateTime.now());

        // 保存并验证
        ExamAdminEntity savedAdmin = entityManager.persistAndFlush(examAdmin);
        entityManager.clear();

        ExamAdminEntity foundAdmin = entityManager.find(ExamAdminEntity.class, savedAdmin.getId());
        
        assertThat(foundAdmin).isNotNull();
        assertThat(foundAdmin.getPermissions()).isNotNull();
        assertThat(foundAdmin.getPermissions().get("canManageScores")).isEqualTo(true);
        assertThat(foundAdmin.getPermissions().get("canManageVenues")).isEqualTo(true);
    }

    @Test
    public void testExamScoreEntityMapping() {
        // 创建考试成绩实体
        ExamScoreEntity examScore = new ExamScoreEntity();
        examScore.setId(UUID.randomUUID());
        examScore.setApplicationId(UUID.randomUUID());
        examScore.setSubjectId(UUID.randomUUID());
        examScore.setScore(new BigDecimal("85.50"));
        examScore.setIsAbsent(false);
        examScore.setGradedBy(UUID.randomUUID());
        examScore.setGradedAt(LocalDateTime.now());
        examScore.setRemarks("优秀成绩");
        examScore.setCreatedAt(LocalDateTime.now());
        examScore.setUpdatedAt(LocalDateTime.now());

        // 保存并验证
        ExamScoreEntity savedScore = entityManager.persistAndFlush(examScore);
        entityManager.clear();

        ExamScoreEntity foundScore = entityManager.find(ExamScoreEntity.class, savedScore.getId());
        
        assertThat(foundScore).isNotNull();
        assertThat(foundScore.getScore()).isEqualByComparingTo(new BigDecimal("85.50"));
        assertThat(foundScore.getIsAbsent()).isFalse();
        assertThat(foundScore.getRemarks()).isEqualTo("优秀成绩");
    }

    @Test
    public void testSlugUniqueConstraint() {
        // 测试slug唯一约束
        ExamEntity exam1 = new ExamEntity();
        exam1.setId(UUID.randomUUID());
        exam1.setCode("TEST1");
        exam1.setSlug("unique-slug");
        exam1.setTitle("测试考试1");
        exam1.setStatus(ExamEntity.ExamStatusEntity.DRAFT);
        exam1.setCreatedBy(UUID.randomUUID());

        entityManager.persistAndFlush(exam1);

        // 尝试创建具有相同slug的第二个考试
        ExamEntity exam2 = new ExamEntity();
        exam2.setId(UUID.randomUUID());
        exam2.setCode("TEST2");
        exam2.setSlug("unique-slug"); // 相同的slug
        exam2.setTitle("测试考试2");
        exam2.setStatus(ExamEntity.ExamStatusEntity.DRAFT);
        exam2.setCreatedBy(UUID.randomUUID());

        // 应该抛出约束违反异常
        try {
            entityManager.persistAndFlush(exam2);
            assertThat(false).as("应该抛出唯一约束违反异常").isTrue();
        } catch (Exception e) {
            assertThat(e.getMessage()).contains("constraint");
        }
    }
}
