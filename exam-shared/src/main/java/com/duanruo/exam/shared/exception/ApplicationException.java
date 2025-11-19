package com.duanruo.exam.shared.exception;

/**
 * 应用异常基类
 */
public class ApplicationException extends RuntimeException {

    private final String errorCode;

    public ApplicationException(String message) {
        super(message);
        this.errorCode = "APPLICATION_ERROR";
    }

    public ApplicationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ApplicationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
