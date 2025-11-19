package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

/**
 * 准考证模板更新请求DTO
 */
public class TicketTemplateUpdateRequest {
    
    @NotBlank
    private String templateName;
    
    private String templateFormat;
    private String numberPrefix;
    private String numberFormat;
    private Integer sequenceStart;
    private Map<String, Object> customFields;
    
    public TicketTemplateUpdateRequest() {}
    
    public String getTemplateName() {
        return templateName;
    }
    
    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }
    
    public String getTemplateFormat() {
        return templateFormat;
    }
    
    public void setTemplateFormat(String templateFormat) {
        this.templateFormat = templateFormat;
    }
    
    public String getNumberPrefix() {
        return numberPrefix;
    }
    
    public void setNumberPrefix(String numberPrefix) {
        this.numberPrefix = numberPrefix;
    }
    
    public String getNumberFormat() {
        return numberFormat;
    }
    
    public void setNumberFormat(String numberFormat) {
        this.numberFormat = numberFormat;
    }
    
    public Integer getSequenceStart() {
        return sequenceStart;
    }
    
    public void setSequenceStart(Integer sequenceStart) {
        this.sequenceStart = sequenceStart;
    }
    
    public Map<String, Object> getCustomFields() {
        return customFields;
    }
    
    public void setCustomFields(Map<String, Object> customFields) {
        this.customFields = customFields;
    }
}
