package com.duanruo.exam.adapter.rest.exception;

import com.duanruo.exam.adapter.rest.dto.ErrorResponse;
import com.duanruo.exam.infrastructure.multitenancy.TenantAccessDeniedException;
import com.duanruo.exam.shared.exception.ApplicationException;
import com.duanruo.exam.shared.exception.DomainException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理领域异常
     */
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(DomainException ex, HttpServletRequest request) {
        logger.warn("Domain exception: {}", ex.getMessage());
        ErrorResponse body = ErrorResponse.of("DOMAIN_ERROR", ex.getMessage(), null, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 处理应用异常
     */
    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ErrorResponse> handleApplicationException(ApplicationException ex, HttpServletRequest request) {
        logger.warn("Application exception: {}", ex.getMessage());
        HttpStatus status = determineHttpStatus(ex);
        ErrorResponse body = ErrorResponse.of(ex.getErrorCode(), ex.getMessage(), null, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    // 删除特定的应用服务异常处理，使用通用的ApplicationException处理

    /**
     * 处理参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        logger.warn("Validation error: {}", ex.getMessage());
        Map<String, Object> details = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            details.put(fieldName, errorMessage);
        });
        ErrorResponse body = ErrorResponse.of("VALIDATION_ERROR", "请求参数不合法", details, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 处理权限不足异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        logger.warn("Constraint violation: {}", ex.getMessage());
        Map<String, Object> details = new HashMap<>();
        ex.getConstraintViolations().forEach(v -> details.put(v.getPropertyPath().toString(), v.getMessage()));
        ErrorResponse body = ErrorResponse.of("CONSTRAINT_VIOLATION", "参数约束校验失败", details, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 处理租户访问被拒绝异常
     */
    @ExceptionHandler(TenantAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleTenantAccessDeniedException(
            TenantAccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Tenant access denied: {}", ex.getMessage());
        ErrorResponse body = ErrorResponse.of("TENANT_ACCESS_DENIED", ex.getMessage(), null, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        // 获取当前认证信息用于调试
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            logger.warn("Access denied for user: {}, authorities: {}, message: {}, path: {}",
                auth.getName(),
                auth.getAuthorities(),
                ex.getMessage(),
                request.getRequestURI());
        } else {
            logger.warn("Access denied (no authentication): {}, path: {}", ex.getMessage(), request.getRequestURI());
        }

        ErrorResponse body = ErrorResponse.of("ACCESS_DENIED", "权限不足", null, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * 处理其他未知异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        logger.error("Unexpected error", ex);
        Map<String, Object> details = new HashMap<>();
        details.put("exception", ex.getClass().getName());
        details.put("message", ex.getMessage());
        ErrorResponse body = ErrorResponse.of("INTERNAL_ERROR", "系统内部错误", details, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }


    /**
     * 处理请求体解析异常（JSON格式错误等）
     */
    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            com.fasterxml.jackson.core.JsonProcessingException.class})
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(Exception ex, HttpServletRequest request) {
        logger.warn("Request body parse error: {}", ex.getMessage());
        Map<String, Object> details = new HashMap<>();
        details.put("exception", ex.getClass().getName());
        details.put("message", ex.getMessage());
        if (ex.getCause() != null) {
            details.put("cause", ex.getCause().getClass().getName() + ": " + ex.getCause().getMessage());
        }
        ErrorResponse body = ErrorResponse.of("INVALID_JSON", "请求体格式错误，无法解析JSON", details, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 根据异常类型确定HTTP状态码
     */
    private HttpStatus determineHttpStatus(ApplicationException ex) {
        String errorCode = ex.getErrorCode();

        if (errorCode.contains("NOT_FOUND")) {
            return HttpStatus.NOT_FOUND;
        } else if (errorCode.contains("EXISTS") || errorCode.contains("CONFLICT")) {
            return HttpStatus.CONFLICT;
        } else if (errorCode.contains("INVALID") || errorCode.contains("REQUIRED")) {
            return HttpStatus.BAD_REQUEST;
        } else {
            return HttpStatus.UNPROCESSABLE_ENTITY;
        }
    }

}
