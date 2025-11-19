package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 准考证验证请求DTO
 */
public class TicketValidationRequest {
    
    @NotBlank
    private String ticketNumber;
    
    @NotBlank
    private String candidateId;
    
    private String examId;
    private String venueId;
    
    public TicketValidationRequest() {}
    
    public TicketValidationRequest(String ticketNumber, String candidateId) {
        this.ticketNumber = ticketNumber;
        this.candidateId = candidateId;
    }
    
    public String getTicketNumber() {
        return ticketNumber;
    }
    
    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }
    
    public String getCandidateId() {
        return candidateId;
    }
    
    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }
    
    public String getExamId() {
        return examId;
    }
    
    public void setExamId(String examId) {
        this.examId = examId;
    }
    
    public String getVenueId() {
        return venueId;
    }
    
    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }
}
