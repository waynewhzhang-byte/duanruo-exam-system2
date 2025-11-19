package com.duanruo.exam.application.dto;

/**
 * 登录响应DTO
 */
public class LoginResponse {
    
    private String token;
    private String tokenType;
    private long expiresIn;
    private UserResponse user;

    // 构造函数
    public LoginResponse() {}

    public LoginResponse(String token, String tokenType, long expiresIn, UserResponse user) {
        this.token = token;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    // Builder模式
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LoginResponse response = new LoginResponse();

        public Builder token(String token) {
            response.token = token;
            return this;
        }

        public Builder tokenType(String tokenType) {
            response.tokenType = tokenType;
            return this;
        }

        public Builder expiresIn(long expiresIn) {
            response.expiresIn = expiresIn;
            return this;
        }

        public Builder user(UserResponse user) {
            response.user = user;
            return this;
        }

        public LoginResponse build() {
            return response;
        }
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "tokenType='" + tokenType + '\'' +
                ", expiresIn=" + expiresIn +
                ", user=" + user +
                '}';
    }
}
