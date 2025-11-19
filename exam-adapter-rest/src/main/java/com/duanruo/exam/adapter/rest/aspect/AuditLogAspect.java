package com.duanruo.exam.adapter.rest.aspect;

import com.duanruo.exam.application.service.AuditLogApplicationService;
import com.duanruo.exam.infrastructure.multitenancy.TenantContext;
import com.duanruo.exam.domain.audit.AuditAction;
import com.duanruo.exam.domain.audit.AuditLog;
import com.duanruo.exam.domain.audit.AuditResult;
import com.duanruo.exam.domain.user.Permission;
import com.duanruo.exam.shared.domain.TenantId;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 审计日志AOP切面
 * 自动记录所有带@PreAuthorize注解的方法调用
 */
@Aspect
@Component
public class AuditLogAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditLogAspect.class);
    private static final Pattern PERMISSION_PATTERN = Pattern.compile("hasAuthority\\('([A-Z_]+)'\\)|hasAnyAuthority\\('([A-Z_,\\s]+)'\\)");
    
    private final AuditLogApplicationService auditLogService;
    private final ObjectMapper objectMapper;
    
    public AuditLogAspect(AuditLogApplicationService auditLogService, ObjectMapper objectMapper) {
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }
    
    /**
     * 拦截所有带@PreAuthorize注解的Controller方法
     */
    @Around("@annotation(org.springframework.security.access.prepost.PreAuthorize) && " +
            "execution(* com.duanruo.exam.adapter.rest.controller..*(..))")
    public Object auditSecuredMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        AuditLog.Builder logBuilder = AuditLog.builder();
        
        try {
            // 获取HTTP请求信息
            HttpServletRequest request = getHttpRequest();
            if (request != null) {
                logBuilder.ipAddress(getClientIp(request))
                    .userAgent(request.getHeader("User-Agent"))
                    .requestMethod(request.getMethod())
                    .requestPath(request.getRequestURI());
            }
            
            // 获取当前用户信息
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                logBuilder.username(username);
                
                // 尝试获取用户ID（假设在authentication的details中）
                Object principal = authentication.getPrincipal();
                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    // 可以从UserDetails中获取更多信息
                    logBuilder.username(((org.springframework.security.core.userdetails.UserDetails) principal).getUsername());
                }
            }
            
            // 获取租户ID
            TenantId tenantId = TenantContext.getCurrentTenant();
            if (tenantId != null) {
                logBuilder.tenantId(tenantId.getValue());
            }
            
            // 获取方法信息
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            
            // 提取权限要求（公开端点不记录审计日志）
            PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
            if (preAuthorize == null) {
                // 没有@PreAuthorize注解的方法，说明是公开端点（通过SecurityConfig配置permitAll()）
                // 直接放行且不记录审计日志
                return joinPoint.proceed();
            }

            String expression = preAuthorize.value();
            // 检查是否为公开端点：permitAll()、permitAll、true、isAnonymous() or isAuthenticated()
            if (expression != null && (
                expression.contains("permitAll()") ||
                expression.equals("permitAll") ||
                expression.equals("true") ||
                expression.contains("isAnonymous() or isAuthenticated()")
            )) {
                // 对于明确标记为公开访问的方法，直接放行且不记录审计日志
                return joinPoint.proceed();
            }

            Permission permission = extractPermission(expression);
            if (permission != null) {
                logBuilder.requiredPermission(permission);
            }
            
            // 推断操作类型
            AuditAction action = inferAction(method.getName(), request != null ? request.getMethod() : "UNKNOWN");
            logBuilder.action(action);
            
            // 提取资源信息
            extractResourceInfo(joinPoint, logBuilder);
            
            // 序列化请求参数（仅记录简单类型，避免敏感信息）
            String params = serializeParams(joinPoint.getArgs());
            logBuilder.requestParams(params);
            
            // 执行目标方法
            Object result = joinPoint.proceed();
            
            // 记录成功
            long executionTime = System.currentTimeMillis() - startTime;
            logBuilder.result(AuditResult.SUCCESS)
                .responseStatus("200")
                .executionTimeMs(executionTime)
                .timestamp(LocalDateTime.now());
            
            auditLogService.log(logBuilder.build());
            
            return result;
            
        } catch (org.springframework.security.access.AccessDeniedException e) {
            // 权限拒绝
            long executionTime = System.currentTimeMillis() - startTime;
            logBuilder.result(AuditResult.PERMISSION_DENIED)
                .responseStatus("403")
                .errorMessage(e.getMessage())
                .executionTimeMs(executionTime)
                .timestamp(LocalDateTime.now());
            
            auditLogService.log(logBuilder.build());
            throw e;
            
        } catch (Exception e) {
            // 其他错误
            long executionTime = System.currentTimeMillis() - startTime;
            logBuilder.result(AuditResult.SYSTEM_ERROR)
                .responseStatus("500")
                .errorMessage(e.getMessage())
                .executionTimeMs(executionTime)
                .timestamp(LocalDateTime.now());
            
            auditLogService.log(logBuilder.build());
            throw e;
        }
    }
    
    private HttpServletRequest getHttpRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
    
    private Permission extractPermission(String expression) {
        Matcher matcher = PERMISSION_PATTERN.matcher(expression);
        if (matcher.find()) {
            String permissionName = matcher.group(1) != null ? matcher.group(1) : matcher.group(2).split(",")[0].trim();
            try {
                return Permission.valueOf(permissionName);
            } catch (IllegalArgumentException e) {
                logger.warn("Unknown permission: {}", permissionName);
            }
        }
        return null;
    }
    
    private AuditAction inferAction(String methodName, String httpMethod) {
        // 根据方法名和HTTP方法推断操作类型
        String lowerMethodName = methodName.toLowerCase();
        
        if (lowerMethodName.contains("login")) return AuditAction.LOGIN;
        if (lowerMethodName.contains("logout")) return AuditAction.LOGOUT;
        
        if (lowerMethodName.contains("exam")) {
            if (httpMethod.equals("POST")) return AuditAction.EXAM_CREATE;
            if (httpMethod.equals("PUT")) return AuditAction.EXAM_UPDATE;
            if (httpMethod.equals("DELETE")) return AuditAction.EXAM_DELETE;
            if (httpMethod.equals("GET")) return AuditAction.EXAM_VIEW;
        }
        
        if (lowerMethodName.contains("position")) {
            if (httpMethod.equals("POST")) return AuditAction.POSITION_CREATE;
            if (httpMethod.equals("PUT")) return AuditAction.POSITION_UPDATE;
            if (httpMethod.equals("DELETE")) return AuditAction.POSITION_DELETE;
            if (httpMethod.equals("GET")) return AuditAction.POSITION_VIEW;
        }
        
        if (lowerMethodName.contains("application") || lowerMethodName.contains("apply")) {
            if (httpMethod.equals("POST")) return AuditAction.APPLICATION_SUBMIT;
            if (httpMethod.equals("PUT")) return AuditAction.APPLICATION_UPDATE;
            if (httpMethod.equals("GET")) return AuditAction.APPLICATION_VIEW;
        }
        
        if (lowerMethodName.contains("review")) {
            if (lowerMethodName.contains("batch")) return AuditAction.REVIEW_BATCH;
            if (lowerMethodName.contains("primary")) return AuditAction.REVIEW_PRIMARY;
            if (lowerMethodName.contains("secondary")) return AuditAction.REVIEW_SECONDARY;
        }
        
        if (lowerMethodName.contains("payment") || lowerMethodName.contains("pay")) {
            if (lowerMethodName.contains("initiate")) return AuditAction.PAYMENT_INITIATE;
            if (lowerMethodName.contains("callback")) return AuditAction.PAYMENT_CALLBACK;
        }
        
        if (lowerMethodName.contains("ticket")) {
            if (lowerMethodName.contains("generate")) return AuditAction.TICKET_GENERATE;
            if (lowerMethodName.contains("verify")) return AuditAction.TICKET_VERIFY;
            if (lowerMethodName.contains("download")) return AuditAction.TICKET_DOWNLOAD;
        }
        
        if (lowerMethodName.contains("score")) {
            if (httpMethod.equals("POST")) return AuditAction.SCORE_CREATE;
            if (httpMethod.equals("PUT")) return AuditAction.SCORE_UPDATE;
            if (httpMethod.equals("GET")) return AuditAction.SCORE_VIEW;
        }
        
        // 默认根据HTTP方法
        return switch (httpMethod) {
            case "POST" -> AuditAction.SYSTEM_CONFIG;
            case "PUT" -> AuditAction.SYSTEM_CONFIG;
            case "DELETE" -> AuditAction.SYSTEM_CONFIG;
            default -> AuditAction.SYSTEM_CONFIG;
        };
    }
    
    private void extractResourceInfo(ProceedingJoinPoint joinPoint, AuditLog.Builder logBuilder) {
        Object[] args = joinPoint.getArgs();
        if (args.length > 0) {
            // 尝试从第一个参数提取资源ID
            Object firstArg = args[0];
            if (firstArg instanceof UUID) {
                logBuilder.resourceId(firstArg.toString());
            } else if (firstArg instanceof Long) {
                logBuilder.resourceId(firstArg.toString());
            }
        }
        
        // 从方法名推断资源类型
        String methodName = joinPoint.getSignature().getName();
        if (methodName.contains("Exam")) logBuilder.resourceType("Exam");
        else if (methodName.contains("Position")) logBuilder.resourceType("Position");
        else if (methodName.contains("Application")) logBuilder.resourceType("Application");
        else if (methodName.contains("Ticket")) logBuilder.resourceType("Ticket");
        else if (methodName.contains("Score")) logBuilder.resourceType("Score");
        else if (methodName.contains("User")) logBuilder.resourceType("User");
        else if (methodName.contains("Tenant")) logBuilder.resourceType("Tenant");
    }
    
    private String serializeParams(Object[] args) {
        try {
            // 过滤掉HttpServletRequest等非业务参数
            Object[] businessArgs = Arrays.stream(args)
                .filter(arg -> !(arg instanceof HttpServletRequest))
                .filter(arg -> !(arg instanceof org.springframework.ui.Model))
                .toArray();
            
            if (businessArgs.length == 0) {
                return null;
            }
            
            String json = objectMapper.writeValueAsString(businessArgs);
            // 限制长度，避免日志过大
            return json.length() > 1000 ? json.substring(0, 1000) + "..." : json;
        } catch (Exception e) {
            logger.warn("Failed to serialize params", e);
            return null;
        }
    }
}

