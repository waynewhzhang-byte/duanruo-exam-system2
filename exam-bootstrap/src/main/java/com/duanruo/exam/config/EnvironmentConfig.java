package com.duanruo.exam.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * 环境配置处理器，用于加载 .env 文件
 */
public class EnvironmentConfig implements EnvironmentPostProcessor {

    private static final String ENV_FILE = ".env";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Resource resource = new FileSystemResource(ENV_FILE);
        if (resource.exists()) {
            loadEnvFile(environment, resource);
        }
    }

    private void loadEnvFile(ConfigurableEnvironment environment, Resource resource) {
        try {
            Properties properties = new Properties();
            Path envPath = Paths.get(resource.getURI());
            
            Files.lines(envPath)
                .filter(line -> !line.trim().isEmpty() && !line.trim().startsWith("#"))
                .forEach(line -> {
                    String[] parts = line.split("=", 2);
                    if (parts.length == 2) {
                        String key = parts[0].trim();
                        String value = parts[1].trim();
                        properties.setProperty(key, value);
                    }
                });
            
            PropertiesPropertySource propertySource = new PropertiesPropertySource("envFile", properties);
            environment.getPropertySources().addLast(propertySource);
            
        } catch (IOException e) {
            // 忽略错误，继续启动
            System.err.println("Warning: Could not load .env file: " + e.getMessage());
        }
    }
}
