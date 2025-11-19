package com.duanruo.exam.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "岗位表单模板响应")
public class FormTemplateResponse {

    @Schema(description = "岗位ID")
    private String positionId;

    @Schema(description = "表单模板JSON字符串")
    private String templateJson;

    public FormTemplateResponse() {}

    public FormTemplateResponse(String positionId, String templateJson) {
        this.positionId = positionId;
        this.templateJson = templateJson;
    }

    public String getPositionId() {
        return positionId;
    }

    public void setPositionId(String positionId) {
        this.positionId = positionId;
    }

    public String getTemplateJson() {
        return templateJson;
    }

    public void setTemplateJson(String templateJson) {
        this.templateJson = templateJson;
    }
}

