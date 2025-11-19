package com.duanruo.exam.adapter.rest.constants;

/**
 * API 常量定义
 */
public final class ApiConstants {
    
    private ApiConstants() {
        // 工具类，禁止实例化
    }
    
    // 响应键名常量
    public static final String KEY_MESSAGE = "message";
    public static final String KEY_STATUS = "status";
    public static final String KEY_ID = "id";
    public static final String KEY_APPLICATION_ID = "applicationId";
    public static final String KEY_EXAM_ID = "examId";
    public static final String KEY_REVIEWER_ID = "reviewerId";
    public static final String KEY_STAGE = "stage";
    public static final String KEY_TICKET_ID = "ticketId";
    public static final String KEY_TICKET_NUMBER = "ticketNumber";
    public static final String KEY_CANDIDATE_ID = "candidateId";
    public static final String KEY_CANDIDATE_NAME = "candidateName";
    public static final String KEY_VALID = "valid";
    public static final String KEY_REASON = "reason";
    public static final String KEY_CODE = "code";
    
    // 状态常量
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_ISSUED = "ISSUED";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    
    // 错误代码常量
    public static final String ERROR_INVALID_SIGNATURE = "INVALID_SIGNATURE";
    public static final String ERROR_VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String ERROR_ACCESS_DENIED = "ACCESS_DENIED";
    public static final String ERROR_NOT_FOUND = "NOT_FOUND";
    public static final String ERROR_INTERNAL_ERROR = "INTERNAL_ERROR";
    public static final String ERROR_DOMAIN_ERROR = "DOMAIN_ERROR";
    
    // 消息常量
    public static final String MSG_SIGNATURE_INVALID = "签名无效";
    public static final String MSG_VALIDATION_ERROR = "请求参数不合法";
    public static final String MSG_ACCESS_DENIED = "权限不足";
    public static final String MSG_INTERNAL_ERROR = "系统内部错误";
    public static final String MSG_PAYMENT_SUCCESS = "支付成功";
    public static final String MSG_TICKET_VALID = "准考证有效";
    public static final String MSG_TICKET_INVALID = "准考证无效或已过期";
    public static final String MSG_BATCH_ASSIGN_SUCCESS = "批量分配成功";
    
    // 默认值常量
    public static final String DEFAULT_CHANNEL = "STUB";
    public static final String DEFAULT_OPERATOR = "SYSTEM";
    public static final String DEFAULT_ADMIN = "ADMIN";
    
    // 权限常量
    public static final String PERMISSION_EXAM_VIEW = "PERMISSION_EXAM_VIEW";
    public static final String PERMISSION_EXAM_CREATE = "PERMISSION_EXAM_CREATE";
    public static final String PERMISSION_EXAM_UPDATE = "PERMISSION_EXAM_UPDATE";
    public static final String PERMISSION_EXAM_DELETE = "PERMISSION_EXAM_DELETE";
    public static final String PERMISSION_EXAM_ADMIN_MANAGE = "PERMISSION_EXAM_ADMIN_MANAGE";
    public static final String PERMISSION_REVIEW_PRIMARY = "PERMISSION_REVIEW_PRIMARY";
    public static final String PERMISSION_REVIEW_SECONDARY = "PERMISSION_REVIEW_SECONDARY";
    public static final String PERMISSION_FILE_UPLOAD = "PERMISSION_FILE_UPLOAD";
    public static final String PERMISSION_SCORE_RECORD = "PERMISSION_SCORE_RECORD";
    
    // 角色常量
    public static final String ROLE_ADMIN = "hasRole('ADMIN')";
    public static final String ROLE_CANDIDATE = "hasRole('CANDIDATE')";
    public static final String ROLE_EXAMINER = "hasRole('EXAMINER')";
    public static final String ROLE_ADMIN_OR_EXAMINER = "hasRole('ADMIN') or hasRole('EXAMINER')";
    public static final String ROLE_CANDIDATE_OR_ADMIN = "hasRole('CANDIDATE') or hasRole('ADMIN')";
}
