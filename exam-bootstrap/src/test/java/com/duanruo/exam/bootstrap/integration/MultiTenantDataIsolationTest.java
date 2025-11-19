package com.duanruo.exam.bootstrap.integration;

import com.duanruo.exam.shared.domain.TenantId;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * 多租户数据隔离集成测试
 * 
 * 测试目标:
 * 1. 租户Schema自动创建
 * 2. 租户数据完全隔离
 * 3. 跨租户访问阻止
 * 4. TenantContext正确工作
 * 5. search_path正确设置
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MultiTenantDataIsolationTest {

    @Autowired
    private TestTenantHelper tenantHelper;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID tenantAId;
    private UUID tenantBId;
    private String tenantASchema;
    private String tenantBSchema;
    private String tenantACode;
    private String tenantBCode;

    @BeforeEach
    void setUp() {
        // 先清理之前的测试数据
        tenantHelper.cleanupAllTestSchemas();

        // 使用时间戳生成唯一的租户代码，避免冲突
        long timestamp = System.currentTimeMillis();
        tenantACode = "test_a_" + timestamp;
        tenantBCode = "test_b_" + timestamp;

        // 创建两个测试租户
        tenantAId = tenantHelper.createTestTenant(tenantACode, "Test Tenant A");
        tenantBId = tenantHelper.createTestTenant(tenantBCode, "Test Tenant B");

        tenantASchema = "tenant_" + tenantACode;
        tenantBSchema = "tenant_" + tenantBCode;
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        // 清理测试数据
        tenantHelper.cleanupAllTestSchemas();

        // 删除租户记录
        if (tenantAId != null) {
            jdbcTemplate.update("DELETE FROM tenants WHERE id = ?", tenantAId);
        }
        if (tenantBId != null) {
            jdbcTemplate.update("DELETE FROM tenants WHERE id = ?", tenantBId);
        }
    }

    @Test
    @Order(1)
    @DisplayName("应该成功创建租户Schema并初始化业务表")
    void shouldCreateTenantSchemaWithBusinessTables() {
        // 验证租户A的Schema存在
        boolean schemaAExists = schemaExists(tenantASchema);
        assertTrue(schemaAExists, "Tenant A schema should exist");

        // 验证租户B的Schema存在
        boolean schemaBExists = schemaExists(tenantBSchema);
        assertTrue(schemaBExists, "Tenant B schema should exist");

        // 验证租户A的业务表存在
        assertThat(tableExistsInSchema(tenantASchema, "exams")).isTrue();
        assertThat(tableExistsInSchema(tenantASchema, "positions")).isTrue();
        assertThat(tableExistsInSchema(tenantASchema, "subjects")).isTrue();
        assertThat(tableExistsInSchema(tenantASchema, "applications")).isTrue();
        assertThat(tableExistsInSchema(tenantASchema, "tickets")).isTrue();
        assertThat(tableExistsInSchema(tenantASchema, "scores")).isTrue();

        // 验证租户B的业务表存在
        assertThat(tableExistsInSchema(tenantBSchema, "exams")).isTrue();
        assertThat(tableExistsInSchema(tenantBSchema, "positions")).isTrue();
        assertThat(tableExistsInSchema(tenantBSchema, "subjects")).isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("应该完全隔离不同租户的数据")
    void shouldIsolateTenantData() {
        // 在租户A中创建考试
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        UUID examAId = createExamInCurrentTenant("EXAM-A-001", "Tenant A Exam");

        // 在租户B中创建考试
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));
        UUID examBId = createExamInCurrentTenant("EXAM-B-001", "Tenant B Exam");

        // 验证租户A只能看到自己的考试
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        List<Map<String, Object>> examsInA = getExamsInCurrentTenant();
        assertThat(examsInA).hasSize(1);
        assertThat(examsInA.get(0).get("code")).isEqualTo("EXAM-A-001");

        // 验证租户B只能看到自己的考试
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));
        List<Map<String, Object>> examsInB = getExamsInCurrentTenant();
        assertThat(examsInB).hasSize(1);
        assertThat(examsInB.get(0).get("code")).isEqualTo("EXAM-B-001");

        // 验证租户A看不到租户B的数据
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        List<Map<String, Object>> examsInAAgain = getExamsInCurrentTenant();
        assertThat(examsInAAgain).noneMatch(exam -> 
            "EXAM-B-001".equals(exam.get("code"))
        );
    }

    @Test
    @Order(3)
    @DisplayName("应该阻止跨租户数据访问")
    void shouldPreventCrossTenantAccess() {
        // 在租户A中创建考试
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        UUID examAId = createExamInCurrentTenant("EXAM-CROSS-001", "Cross Tenant Test");

        // 切换到租户B，尝试访问租户A的考试
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));

        // 设置租户B的search_path
        String schemaBName = getSchemaNameForTenant(tenantBId);
        jdbcTemplate.execute("SET search_path TO " + schemaBName + ", public");

        // 通过ID查询应该返回null（因为在不同的Schema中）
        String sql = "SELECT * FROM exams WHERE id = ?";
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, examAId);

        assertThat(result).isEmpty();
    }

    @Test
    @Order(4)
    @DisplayName("TenantContext应该正确管理租户上下文")
    void shouldManageTenantContextCorrectly() {
        // 初始状态：无租户上下文
        assertFalse(TenantContext.hasTenantContext());
        assertNull(TenantContext.getCurrentTenant());

        // 设置租户A
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        assertTrue(TenantContext.hasTenantContext());
        assertEquals(tenantAId.toString(), TenantContext.getCurrentTenant().toString());

        // 切换到租户B
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));
        assertTrue(TenantContext.hasTenantContext());
        assertEquals(tenantBId.toString(), TenantContext.getCurrentTenant().toString());

        // 清除上下文
        TenantContext.clear();
        assertFalse(TenantContext.hasTenantContext());
        assertNull(TenantContext.getCurrentTenant());
    }

    @Test
    @Order(5)
    @DisplayName("应该正确设置PostgreSQL search_path")
    void shouldSetSearchPathCorrectly() {
        // 设置租户A上下文
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        
        // 手动设置search_path（模拟TenantSchemaConnectionProvider的行为）
        jdbcTemplate.execute("SET search_path TO " + tenantASchema + ", public");
        
        // 验证当前search_path
        String currentSearchPath = jdbcTemplate.queryForObject(
            "SHOW search_path", String.class
        );
        
        assertThat(currentSearchPath).contains(tenantASchema);
        
        // 在当前search_path下创建数据
        UUID examId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO exams (id, code, title, status) VALUES (?, ?, ?, ?)",
            examId, "EXAM-PATH-001", "Search Path Test", "DRAFT"
        );
        
        // 验证数据在正确的Schema中
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM " + tenantASchema + ".exams WHERE id = ?",
            Integer.class,
            examId
        );
        
        assertThat(count).isEqualTo(1);
    }

    @Test
    @Order(6)
    @DisplayName("应该支持相同code在不同租户中")
    void shouldAllowSameCodeInDifferentTenants() {
        String sameCode = "EXAM-DUPLICATE-001";
        
        // 在租户A中创建考试
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        jdbcTemplate.execute("SET search_path TO " + tenantASchema + ", public");
        UUID examAId = createExamInCurrentTenant(sameCode, "Exam in Tenant A");
        
        // 在租户B中创建相同code的考试（应该成功）
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));
        jdbcTemplate.execute("SET search_path TO " + tenantBSchema + ", public");
        UUID examBId = createExamInCurrentTenant(sameCode, "Exam in Tenant B");
        
        // 验证两个考试都存在且ID不同
        assertNotEquals(examAId, examBId);
        
        // 验证租户A中的考试
        TenantContext.setCurrentTenant(TenantId.of(tenantAId));
        jdbcTemplate.execute("SET search_path TO " + tenantASchema + ", public");
        List<Map<String, Object>> examsA = jdbcTemplate.queryForList(
            "SELECT * FROM exams WHERE code = ?", sameCode
        );
        assertThat(examsA).hasSize(1);
        assertThat(examsA.get(0).get("title")).isEqualTo("Exam in Tenant A");
        
        // 验证租户B中的考试
        TenantContext.setCurrentTenant(TenantId.of(tenantBId));
        jdbcTemplate.execute("SET search_path TO " + tenantBSchema + ", public");
        List<Map<String, Object>> examsB = jdbcTemplate.queryForList(
            "SELECT * FROM exams WHERE code = ?", sameCode
        );
        assertThat(examsB).hasSize(1);
        assertThat(examsB.get(0).get("title")).isEqualTo("Exam in Tenant B");
    }

    // ========== 辅助方法 ==========

    private boolean schemaExists(String schemaName) {
        String sql = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = ?)";
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, Boolean.class, schemaName));
    }

    private boolean tableExistsInSchema(String schemaName, String tableName) {
        String sql = "SELECT EXISTS(SELECT 1 FROM information_schema.tables " +
                    "WHERE table_schema = ? AND table_name = ?)";
        return Boolean.TRUE.equals(
            jdbcTemplate.queryForObject(sql, Boolean.class, schemaName, tableName)
        );
    }

    private UUID createExamInCurrentTenant(String code, String title) {
        // 获取当前租户的schema名称并设置search_path
        TenantId currentTenant = TenantContext.getCurrentTenant();
        String schemaName = getSchemaNameForTenant(currentTenant.getValue());
        jdbcTemplate.execute("SET search_path TO " + schemaName + ", public");

        UUID examId = UUID.randomUUID();
        String sql = "INSERT INTO exams (id, code, title, status, created_at, updated_at) " +
                    "VALUES (?, ?, ?, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        jdbcTemplate.update(sql, examId, code, title);
        return examId;
    }

    private List<Map<String, Object>> getExamsInCurrentTenant() {
        // 获取当前租户的schema名称并设置search_path
        TenantId currentTenant = TenantContext.getCurrentTenant();
        String schemaName = getSchemaNameForTenant(currentTenant.getValue());
        jdbcTemplate.execute("SET search_path TO " + schemaName + ", public");

        return jdbcTemplate.queryForList("SELECT * FROM exams");
    }

    private String getSchemaNameForTenant(UUID tenantId) {
        return jdbcTemplate.queryForObject(
            "SELECT schema_name FROM public.tenants WHERE id = ?",
            String.class,
            tenantId
        );
    }
}

