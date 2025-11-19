package com.duanruo.exam.application.dto;

/**
 * 准考证验证请求DTO
 */
public class TicketVerifyRequest {
    
    private String ticketNo;
    private String candidateIdNumber; // 可选：用于双重验证
    
    public String getTicketNo() {
        return ticketNo;
    }
    
    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }
    
    public String getCandidateIdNumber() {
        return candidateIdNumber;
    }
    
    public void setCandidateIdNumber(String candidateIdNumber) {
        this.candidateIdNumber = candidateIdNumber;
    }
}

