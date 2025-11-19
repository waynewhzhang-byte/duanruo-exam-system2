package com.duanruo.exam.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI配置
 * 生成完整的API文档供前端开发使用
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI examRegistrationOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("考试报名系统 API")
                        .description("""
                                # 考试报名系统 REST API
                                
                                这是一个完整的考试报名管理系统，提供以下核心功能：
                                
                                ## 🎯 主要功能模块
                                
                                ### 1. 考试管理
                                - 考试的创建、编辑、删除
                                - 考试状态管理（草稿→开放→关闭）
                                - 岗位和科目配置
                                
                                ### 2. 报名申请
                                - 候选人报名申请提交
                                - 自定义表单字段支持
                                - 附件上传和管理
                                - 申请状态跟踪
                                
                                ### 3. 审核流程
                                - 自动审核引擎
                                - 两级人工审核（Primary + Secondary）
                                - 批量审核操作
                                - 完整的审计日志
                                
                                ### 4. 支付与准考证
                                - 在线支付集成
                                - 准考证自动生成
                                - PDF下载和打印
                                - 二维码验证
                                
                                ### 5. 文件管理
                                - 安全的文件上传下载
                                - 病毒扫描集成
                                - 文件类型验证
                                - 预签名URL支持
                                
                                ## 🔐 认证授权
                                
                                系统使用JWT Token进行认证，支持以下角色：
                                - **ADMIN**: 系统管理员，拥有所有权限
                                - **PRIMARY_REVIEWER**: 一级审核员
                                - **SECONDARY_REVIEWER**: 二级审核员
                                - **CANDIDATE**: 候选人，可以报名和查看自己的申请
                                - **EXAMINER**: 考官，可以验证准考证
                                
                                ## 📊 API设计特点
                                
                                - **RESTful设计**: 符合REST规范的API设计
                                - **统一响应格式**: 标准化的JSON响应结构
                                - **完整错误处理**: 详细的错误码和错误信息
                                - **分页支持**: 列表接口支持分页查询
                                - **批量操作**: 支持批量数据处理
                                - **状态机**: 完整的业务状态流转
                                
                                ## 🚀 快速开始
                                
                                1. 获取JWT Token（通过认证接口）
                                2. 在请求头中添加：`Authorization: Bearer <token>`
                                3. 调用相应的API接口
                                
                                ## 📞 技术支持
                                
                                如有问题，请联系开发团队。
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("考试报名系统开发团队")
                                .email("dev@duanruo.com")
                                .url("https://github.com/duanruo/exam-registration"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("本地开发环境"),
                        new Server()
                                .url("https://api-test.duanruo.com")
                                .description("测试环境"),
                        new Server()
                                .url("https://api.duanruo.com")
                                .description("生产环境")
                ))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT认证Token，格式：Bearer <token>")));
    }
}
