package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.user.*;
import com.duanruo.exam.infrastructure.persistence.entity.UserEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户仓储实现
 */
@Repository
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository jpaRepository;
    private final ObjectMapper objectMapper;

    public UserRepositoryImpl(UserJpaRepository jpaRepository, ObjectMapper objectMapper) {
        this.jpaRepository = jpaRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void save(User user) {
        var userId = user.getId().getValue();
        if (jpaRepository.existsById(userId)) {
            // Load managed entity and update fields to avoid NonUniqueObjectException
            UserEntity managed = jpaRepository.findById(userId).orElseThrow();
            // Update fields
            managed.setUsername(user.getUsername());
            managed.setEmail(user.getEmail());
            managed.setPasswordHash(user.getPasswordHash());
            managed.setFullName(user.getFullName());
            managed.setPhoneNumber(user.getPhoneNumber());
            managed.setStatus(toEntityStatus(user.getStatus()));
            managed.setRoles(serializeRoles(user.getRoles()));
            managed.setLastLoginAt(user.getLastLoginAt());
            managed.setPasswordChangedAt(user.getPasswordChangedAt());
            managed.setEmailVerified(user.isEmailVerified());
            managed.setPhoneVerified(user.isPhoneVerified());
            managed.setDepartment(user.getDepartment());
            managed.setJobTitle(user.getJobTitle());
            // No need to call save; managed entity will be flushed by transaction
        } else {
            UserEntity entity = toEntity(user);
            jpaRepository.save(entity);
        }
    }

    @Override
    public Optional<User> findById(UserId id) {
        return jpaRepository.findById(id.getValue())
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return jpaRepository.findByUsername(username)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByPhoneNumber(String phoneNumber) {
        return jpaRepository.findByPhoneNumber(phoneNumber)
                .map(this::toDomain);
    }

    @Override
    public List<User> findByRole(Role role) {
        return jpaRepository.findByRoleContaining(role.getName())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findByStatus(UserStatus status) {
        UserEntity.UserStatus entityStatus = toEntityStatus(status);
        return jpaRepository.findByStatus(entityStatus)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findActiveUsers() {
        return jpaRepository.findByStatusOrderByCreatedAtDesc(UserEntity.UserStatus.ACTIVE)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findReviewers() {
        return jpaRepository.findReviewers()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findPrimaryReviewers() {
        return jpaRepository.findPrimaryReviewers()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findSecondaryReviewers() {
        return jpaRepository.findSecondaryReviewers()
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByUsername(String username) {
        return jpaRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return jpaRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    public void delete(User user) {
        jpaRepository.deleteById(user.getId().getValue());
    }

    @Override
    public void deleteById(UserId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public long countByRole(Role role) {
        return jpaRepository.countByRoleContaining(role.getName());
    }

    @Override
    public long countByStatus(UserStatus status) {
        UserEntity.UserStatus entityStatus = toEntityStatus(status);
        return jpaRepository.countByStatus(entityStatus);
    }

    /**
     * 将领域对象转换为实体
     */
    private UserEntity toEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId().getValue());
        entity.setUsername(user.getUsername());
        entity.setEmail(user.getEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFullName(user.getFullName());
        entity.setPhoneNumber(user.getPhoneNumber());
        entity.setStatus(toEntityStatus(user.getStatus()));
        entity.setRoles(serializeRoles(user.getRoles()));
        entity.setLastLoginAt(user.getLastLoginAt());
        entity.setPasswordChangedAt(user.getPasswordChangedAt());
        entity.setEmailVerified(user.isEmailVerified());
        entity.setPhoneVerified(user.isPhoneVerified());
        entity.setDepartment(user.getDepartment());
        entity.setJobTitle(user.getJobTitle());
        return entity;
    }

    /**
     * 将实体转换为领域对象
     */
    private User toDomain(UserEntity entity) {
        UserId userId = UserId.of(entity.getId());
        Set<Role> roles = deserializeRoles(entity.getRoles());
        
        User user = new User(
                userId,
                entity.getUsername(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getFullName(),
                roles
        );

        // 设置其他属性
        if (entity.getPhoneNumber() != null) {
            user.setPhoneNumber(entity.getPhoneNumber());
        }
        if (entity.getDepartment() != null) {
            user.setDepartment(entity.getDepartment());
        }
        if (entity.getJobTitle() != null) {
            user.setJobTitle(entity.getJobTitle());
        }

        return user;
    }

    /**
     * 序列化角色集合为JSON字符串
     */
    private String serializeRoles(Set<Role> roles) {
        try {
            List<String> roleNames = roles.stream()
                    .map(Role::getName)
                    .collect(Collectors.toList());
            return objectMapper.writeValueAsString(roleNames);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize roles", e);
        }
    }

    /**
     * 反序列化JSON字符串为角色集合
     */
    private Set<Role> deserializeRoles(String rolesJson) {
        try {
            if (rolesJson == null || rolesJson.isBlank()) {
                return Set.of();
            }
            List<String> roleNames = objectMapper.readValue(rolesJson, new TypeReference<List<String>>() {});
            return roleNames.stream()
                    .map(Role::fromName)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            // 容错：非法或空的JSON，降级为空集合，避免500
            return Set.of();
        }
    }

    /**
     * 转换用户状态
     */
    private UserEntity.UserStatus toEntityStatus(UserStatus status) {
        return switch (status) {
            case ACTIVE -> UserEntity.UserStatus.ACTIVE;
            case INACTIVE -> UserEntity.UserStatus.INACTIVE;
            case LOCKED -> UserEntity.UserStatus.LOCKED;
            case PENDING_VERIFICATION -> UserEntity.UserStatus.PENDING_VERIFICATION;
            case DELETED -> UserEntity.UserStatus.DELETED;
        };
    }

    /**
     * 转换实体状态
     */
    private UserStatus toStatus(UserEntity.UserStatus status) {
        return switch (status) {
            case ACTIVE -> UserStatus.ACTIVE;
            case INACTIVE -> UserStatus.INACTIVE;
            case LOCKED -> UserStatus.LOCKED;
            case PENDING_VERIFICATION -> UserStatus.PENDING_VERIFICATION;
            case DELETED -> UserStatus.DELETED;
        };
    }
}
