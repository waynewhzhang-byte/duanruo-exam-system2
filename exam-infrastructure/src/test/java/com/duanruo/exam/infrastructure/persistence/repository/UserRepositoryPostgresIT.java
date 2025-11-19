package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.UserEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@Testcontainers
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EntityScan(basePackageClasses = UserEntity.class)
@EnableJpaRepositories(basePackageClasses = UserJpaRepository.class)
class UserRepositoryPostgresIT {

    @BeforeAll
    static void ensureDockerAvailable() {
        try {
            org.testcontainers.DockerClientFactory.instance().client();
        } catch (Throwable t) {
            Assumptions.assumeTrue(false, "Docker not available: " + t.getMessage());
        }
    }

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("exam_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.flyway.enabled", () -> "false");
    }

    @Autowired
    private UserJpaRepository jpaRepository;

    @Test
    void save_and_find_on_postgres() {
        UserRepositoryImpl repo = new UserRepositoryImpl(jpaRepository, new com.fasterxml.jackson.databind.ObjectMapper());

        UserId id = UserId.of(UUID.randomUUID());
        User user = new User(id, "pguser", "pg@example.com", "$2a$10$hash", "PG User", Set.of(Role.CANDIDATE));

        repo.save(user);
        Optional<UserEntity> found = jpaRepository.findById(id.getValue());
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("pguser");
    }
}

