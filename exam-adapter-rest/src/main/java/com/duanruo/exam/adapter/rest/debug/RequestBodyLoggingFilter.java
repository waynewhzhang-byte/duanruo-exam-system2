package com.duanruo.exam.adapter.rest.debug;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;

/**
 * 临时调试过滤器 - 记录请求体内容
 * 用于调试JSON解析问题
 */
@Component
public class RequestBodyLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestBodyLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest httpRequest) {
            String uri = httpRequest.getRequestURI();
            String method = httpRequest.getMethod();
            
            // 只记录登录请求
            if ("POST".equals(method) && uri.contains("/auth/login")) {
                logger.info("=== 登录请求调试 ===");
                logger.info("URI: {}", uri);
                logger.info("Method: {}", method);
                logger.info("Content-Type: {}", httpRequest.getContentType());
                logger.info("Content-Length: {}", httpRequest.getContentLength());
                
                // 包装请求以便多次读取请求体
                CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(httpRequest);
                
                // 读取并记录请求体
                String body = wrappedRequest.getCachedBody();
                logger.info("请求体长度: {}", body.length());
                logger.info("请求体内容: [{}]", body);
                
                // 逐字符分析
                for (int i = 0; i < Math.min(body.length(), 50); i++) {
                    char c = body.charAt(i);
                    int code = (int) c;
                    logger.info("位置 {}: '{}' (ASCII: {})", i, c, code);
                }
                
                chain.doFilter(wrappedRequest, response);
            } else {
                chain.doFilter(request, response);
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    /**
     * 可缓存请求体的HttpServletRequest包装器
     */
    private static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final String cachedBody;

        public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            InputStream requestInputStream = request.getInputStream();
            this.cachedBody = StreamUtils.copyToString(requestInputStream, StandardCharsets.UTF_8);
        }

        public String getCachedBody() {
            return this.cachedBody;
        }

        @Override
        public ServletInputStream getInputStream() {
            return new CachedBodyServletInputStream(this.cachedBody.getBytes(StandardCharsets.UTF_8));
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new StringReader(this.cachedBody));
        }
    }

    /**
     * 缓存的ServletInputStream实现
     */
    private static class CachedBodyServletInputStream extends ServletInputStream {
        private final ByteArrayInputStream inputStream;

        public CachedBodyServletInputStream(byte[] body) {
            this.inputStream = new ByteArrayInputStream(body);
        }

        @Override
        public boolean isFinished() {
            return inputStream.available() == 0;
        }

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            // Not implemented
        }

        @Override
        public int read() {
            return inputStream.read();
        }
    }
}
