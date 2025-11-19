package com.duanruo.exam.adapter.rest.config;

import com.duanruo.exam.adapter.rest.security.CurrentUserIdArgumentResolver;
import com.duanruo.exam.adapter.rest.security.CurrentUsernameArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentUserIdArgumentResolver());
        resolvers.add(new CurrentUsernameArgumentResolver());
    }
}

