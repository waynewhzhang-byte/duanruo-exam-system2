package com.duanruo.exam.domain.user;

import java.util.List;
import java.util.Optional;

/**
 * 用户仓储接口
 */
public interface UserRepository {
    
    /**
     * 保存用户
     */
    void save(User user);
    
    /**
     * 根据ID查找用户
     */
    Optional<User> findById(UserId id);
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 根据手机号查找用户
     */
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    /**
     * 根据角色查找用户
     */
    List<User> findByRole(Role role);
    
    /**
     * 根据状态查找用户
     */
    List<User> findByStatus(UserStatus status);
    
    /**
     * 查找所有活跃用户
     */
    List<User> findActiveUsers();
    
    /**
     * 查找所有审核员
     */
    List<User> findReviewers();
    
    /**
     * 查找一级审核员
     */
    List<User> findPrimaryReviewers();
    
    /**
     * 查找二级审核员
     */
    List<User> findSecondaryReviewers();
    
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
     * 删除用户
     */
    void delete(User user);
    
    /**
     * 根据ID删除用户
     */
    void deleteById(UserId id);
    
    /**
     * 统计用户数量
     */
    long count();
    
    /**
     * 根据角色统计用户数量
     */
    long countByRole(Role role);
    
    /**
     * 根据状态统计用户数量
     */
    long countByStatus(UserStatus status);
}
