package com.duanruo.exam.infrastructure.multitenancy;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 租户访问被拒绝异常
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class TenantAccessDeniedException extends RuntimeException {
    
    public TenantAccessDeniedException(String message) {
        super(message);
    }
    
    public TenantAccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }
}

