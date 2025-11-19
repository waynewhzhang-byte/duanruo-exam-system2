package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.infrastructure.persistence.entity.UserEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@DataJpaTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:exam_test;MODE=PostgreSQL;INIT=RUNSCRIPT FROM 'classpath:schema-h2.sql'",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.test.database.replace=NONE",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect"
})
@EntityScan(basePackageClasses = UserEntity.class)
@EnableJpaRepositories(basePackageClasses = UserJpaRepository.class)
class UserRepositoryImplTest {

    @Autowired
    private UserJpaRepository jpaRepository;

    @Test
    void save_newAndUpdate_existingEntity() {
        UserRepositoryImpl repo = new UserRepositoryImpl(jpaRepository, new ObjectMapper());

        UserId id = UserId.of(UUID.randomUUID());
        User user = new User(id, "alice", "alice@example.com", "$2a$10$hash", "Alice", Set.of(Role.CANDIDATE));

        // save new
        repo.save(user);
        Optional<UserEntity> created = jpaRepository.findById(id.getValue());
        assertThat(created).isPresent();
        assertThat(created.get().getUsername()).isEqualTo("alice");

        // update existing
        User updatedDomain = new User(id, "alice", "alice2@example.com", "$2a$10$newhash", "Alice W.", Set.of(Role.CANDIDATE));
        repo.save(updatedDomain);
        Optional<UserEntity> updated = jpaRepository.findById(id.getValue());
        assertThat(updated).isPresent();
        assertThat(updated.get().getEmail()).isEqualTo("alice2@example.com");
        assertThat(updated.get().getPasswordHash()).isEqualTo("$2a$10$newhash");
        assertThat(updated.get().getFullName()).isEqualTo("Alice W.");
    }
}

