package com.duanruo.exam.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 考试复制请求DTO
 */
public class ExamCopyRequest {

    @NotBlank(message = "考试代码不能为空")
    @Size(min = 2, max = 64, message = "考试代码长度必须在2-64个字符之间")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "考试代码只能包含大写字母、数字、下划线和连字符")
    private String newCode;

    @NotBlank(message = "考试标题不能为空")
    @Size(min = 2, max = 255, message = "考试标题长度必须在2-255个字符之间")
    private String newTitle;

    @Size(max = 100, message = "URL后缀长度不能超过100个字符")
    @Pattern(regexp = "^[a-z0-9-]*$", message = "URL后缀只能包含小写字母、数字和连字符")
    private String newSlug;

    private Boolean copyPositions = true;  // 是否复制岗位
    private Boolean copySubjects = true;  // 是否复制科目
    private Boolean copyAnnouncement = true;  // 是否复制公告
    private Boolean copyRulesConfig = true;  // 是否复制规则配置
    private Boolean copyFeeSettings = true;  // 是否复制费用设置

    public ExamCopyRequest() {
    }

    public String getNewCode() {
        return newCode;
    }

    public void setNewCode(String newCode) {
        this.newCode = newCode;
    }

    public String getNewTitle() {
        return newTitle;
    }

    public void setNewTitle(String newTitle) {
        this.newTitle = newTitle;
    }

    public String getNewSlug() {
        return newSlug;
    }

    public void setNewSlug(String newSlug) {
        this.newSlug = newSlug;
    }

    public Boolean getCopyPositions() {
        return copyPositions;
    }

    public void setCopyPositions(Boolean copyPositions) {
        this.copyPositions = copyPositions;
    }

    public Boolean getCopySubjects() {
        return copySubjects;
    }

    public void setCopySubjects(Boolean copySubjects) {
        this.copySubjects = copySubjects;
    }

    public Boolean getCopyAnnouncement() {
        return copyAnnouncement;
    }

    public void setCopyAnnouncement(Boolean copyAnnouncement) {
        this.copyAnnouncement = copyAnnouncement;
    }

    public Boolean getCopyRulesConfig() {
        return copyRulesConfig;
    }

    public void setCopyRulesConfig(Boolean copyRulesConfig) {
        this.copyRulesConfig = copyRulesConfig;
    }

    public Boolean getCopyFeeSettings() {
        return copyFeeSettings;
    }

    public void setCopyFeeSettings(Boolean copyFeeSettings) {
        this.copyFeeSettings = copyFeeSettings;
    }
}

