package com.duanruo.exam.application.dto;

import java.time.LocalDateTime;

/**
 * 准考证验证响应DTO
 */
public class TicketVerifyResponse {
    
    private boolean valid;
    private String message;
    private String ticketNo;
    private String candidateName;
    private String examTitle;
    private String positionTitle;
    private String venueName;
    private String roomNumber;
    private String seatNumber;
    private LocalDateTime examStartTime;
    private LocalDateTime examEndTime;
    
    public boolean isValid() {
        return valid;
    }
    
    public void setValid(boolean valid) {
        this.valid = valid;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getTicketNo() {
        return ticketNo;
    }
    
    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }
    
    public String getCandidateName() {
        return candidateName;
    }
    
    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }
    
    public String getExamTitle() {
        return examTitle;
    }
    
    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }
    
    public String getPositionTitle() {
        return positionTitle;
    }
    
    public void setPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle;
    }
    
    public String getVenueName() {
        return venueName;
    }
    
    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }
    
    public String getRoomNumber() {
        return roomNumber;
    }
    
    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }
    
    public String getSeatNumber() {
        return seatNumber;
    }
    
    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }
    
    public LocalDateTime getExamStartTime() {
        return examStartTime;
    }
    
    public void setExamStartTime(LocalDateTime examStartTime) {
        this.examStartTime = examStartTime;
    }
    
    public LocalDateTime getExamEndTime() {
        return examEndTime;
    }
    
    public void setExamEndTime(LocalDateTime examEndTime) {
        this.examEndTime = examEndTime;
    }
}

