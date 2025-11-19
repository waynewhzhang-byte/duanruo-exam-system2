package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;

public class ApplicationAttachmentUploadRequest {
    @NotBlank
    private String filename;
    @NotBlank
    private String type;

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}

