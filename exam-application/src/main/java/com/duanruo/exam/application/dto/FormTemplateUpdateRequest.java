package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "岗位表单模板更新请求")
public class FormTemplateUpdateRequest {

    @Schema(description = "表单模板JSON字符串", example = "{\"version\":1,\"fields\":[{\"name\":\"name\",\"type\":\"text\"}]}")
    private String templateJson;

    public String getTemplateJson() {
        return templateJson;
    }

    public void setTemplateJson(String templateJson) {
        this.templateJson = templateJson;
    }
}

