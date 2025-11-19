package com.duanruo.exam.shared.pii;

import com.duanruo.exam.shared.security.EncryptionUtil;

/**
 * PII数据脱敏工具类
 * 提供各种类型的PII数据脱敏方法
 * 
 * @author Augment Agent
 * @since 2025-01-XX
 */
public class PIIMasker {
    
    /**
     * 根据PII类型进行脱敏
     * 
     * @param value PII数据原始值
     * @param type PII类型
     * @return 脱敏后的值
     */
    public static String mask(String value, PIIType type) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        
        return switch (type) {
            case NAME -> EncryptionUtil.maskName(value);
            case ID_CARD -> EncryptionUtil.maskIdCard(value);
            case PHONE -> EncryptionUtil.maskPhone(value);
            case EMAIL -> EncryptionUtil.maskEmail(value);
            case BANK_CARD -> maskBankCard(value);
            case ADDRESS -> maskAddress(value);
            case CUSTOM -> maskCustom(value);
        };
    }
    
    /**
     * 脱敏银行卡号
     * 保留前4位和后4位，中间用*代替
     */
    private static String maskBankCard(String bankCard) {
        if (bankCard == null || bankCard.length() < 8) {
            return bankCard;
        }
        return bankCard.substring(0, 4) + "********" + bankCard.substring(bankCard.length() - 4);
    }
    
    /**
     * 脱敏地址
     * 保留省市，详细地址用*代替
     */
    private static String maskAddress(String address) {
        if (address == null || address.length() < 6) {
            return address;
        }
        // 简单实现：保留前6个字符（通常是省市），其余用*代替
        return address.substring(0, Math.min(6, address.length())) + "****";
    }
    
    /**
     * 自定义脱敏
     * 完全用*代替
     */
    private static String maskCustom(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        return "****";
    }
    
    /**
     * 判断是否需要脱敏
     * 
     * @param userRoles 用户角色列表
     * @param allowedRoles 允许查看完整数据的角色
     * @return true表示需要脱敏，false表示不需要脱敏
     */
    public static boolean shouldMask(String[] userRoles, String[] allowedRoles) {
        if (allowedRoles == null || allowedRoles.length == 0) {
            // 没有配置允许的角色，所有人都需要脱敏
            return true;
        }
        
        if (userRoles == null || userRoles.length == 0) {
            // 用户没有角色，需要脱敏
            return true;
        }
        
        // 检查用户是否有允许查看完整数据的角色
        for (String userRole : userRoles) {
            for (String allowedRole : allowedRoles) {
                if (userRole.equals(allowedRole)) {
                    return false; // 用户有权限，不需要脱敏
                }
            }
        }
        
        return true; // 用户没有权限，需要脱敏
    }
}

