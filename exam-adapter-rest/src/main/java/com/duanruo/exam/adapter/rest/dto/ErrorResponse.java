package com.duanruo.exam.adapter.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Schema(name = "ErrorResponse", description = "标准错误响应模型")
public class ErrorResponse {

    @Schema(description = "错误代码（可读）", example = "VALIDATION_ERROR")
    private String errorCode;

    @Schema(description = "错误信息", example = "请求参数不合法")
    private String message;

    @Schema(description = "详情（字段错误或上下文信息）")
    private Map<String, Object> details;

    @Schema(description = "时间戳，Asia/Shanghai，格式 yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    @Schema(description = "请求路径", example = "/positions/123")
    private String path;

    public ErrorResponse() {
    }

    public ErrorResponse(String errorCode, String message, Map<String, Object> details, LocalDateTime timestamp, String path) {
        this.errorCode = errorCode;
        this.message = message;
        this.details = details;
        this.timestamp = timestamp;
        this.path = path;
    }

    public static ErrorResponse of(String errorCode, String message, Map<String, Object> details, String path) {
        return new ErrorResponse(errorCode, message, details, LocalDateTime.now(ZoneId.of("Asia/Shanghai")), path);
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}

