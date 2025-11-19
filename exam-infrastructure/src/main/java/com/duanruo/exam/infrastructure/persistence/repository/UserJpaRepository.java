package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户JPA仓储接口
 */
@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {

    /**
     * 根据用户名查找用户
     */
    Optional<UserEntity> findByUsername(String username);

    /**
     * 根据邮箱查找用户
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * 根据手机号查找用户
     */
    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    /**
     * 根据状态查找用户
     */
    List<UserEntity> findByStatus(UserEntity.UserStatus status);

    /**
     * 查找活跃用户
     */
    List<UserEntity> findByStatusOrderByCreatedAtDesc(UserEntity.UserStatus status);

    /**
     * 根据角色查找用户
     */
    @Query("SELECT u FROM UserEntity u WHERE u.roles LIKE %:role%")
    List<UserEntity> findByRoleContaining(@Param("role") String role);

    /**
     * 查找审核员（包含PRIMARY_REVIEWER或SECONDARY_REVIEWER角色）
     */
    @Query("SELECT u FROM UserEntity u WHERE u.roles LIKE '%PRIMARY_REVIEWER%' OR u.roles LIKE '%SECONDARY_REVIEWER%'")
    List<UserEntity> findReviewers();

    /**
     * 查找一级审核员
     */
    @Query("SELECT u FROM UserEntity u WHERE u.roles LIKE '%PRIMARY_REVIEWER%'")
    List<UserEntity> findPrimaryReviewers();

    /**
     * 查找二级审核员
     */
    @Query("SELECT u FROM UserEntity u WHERE u.roles LIKE '%SECONDARY_REVIEWER%'")
    List<UserEntity> findSecondaryReviewers();

    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * 统计各状态用户数量
     */
    long countByStatus(UserEntity.UserStatus status);

    /**
     * 统计各角色用户数量
     */
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.roles LIKE %:role%")
    long countByRoleContaining(@Param("role") String role);

    /**
     * 查找用户名或邮箱匹配的用户（用于登录）
     */
    @Query("SELECT u FROM UserEntity u WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<UserEntity> findByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail);
}
