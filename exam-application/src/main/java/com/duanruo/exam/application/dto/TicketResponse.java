package com.duanruo.exam.application.dto;

import com.duanruo.exam.domain.ticket.TicketStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 准考证响应DTO
 */
public class TicketResponse {
    
    private UUID id;
    private UUID applicationId;
    private UUID examId;
    private UUID positionId;
    private UUID candidateId;
    private String ticketNo;
    private TicketStatus status;
    
    // 考生信息
    private String candidateName;
    private String candidateIdNumber;
    private String candidatePhoto;
    
    // 考试信息
    private String examTitle;
    private String positionTitle;
    private LocalDateTime examStartTime;
    private LocalDateTime examEndTime;
    
    // 考场信息
    private String venueName;
    private String roomNumber;
    private String seatNumber;
    
    // 二维码和条形码
    private String qrCode;
    private String barcode;
    
    // 时间戳
    private LocalDateTime issuedAt;
    private LocalDateTime printedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getApplicationId() {
        return applicationId;
    }
    
    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }
    
    public UUID getExamId() {
        return examId;
    }
    
    public void setExamId(UUID examId) {
        this.examId = examId;
    }
    
    public UUID getPositionId() {
        return positionId;
    }
    
    public void setPositionId(UUID positionId) {
        this.positionId = positionId;
    }
    
    public UUID getCandidateId() {
        return candidateId;
    }
    
    public void setCandidateId(UUID candidateId) {
        this.candidateId = candidateId;
    }
    
    public String getTicketNo() {
        return ticketNo;
    }
    
    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }
    
    public TicketStatus getStatus() {
        return status;
    }
    
    public void setStatus(TicketStatus status) {
        this.status = status;
    }
    
    public String getCandidateName() {
        return candidateName;
    }
    
    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }
    
    public String getCandidateIdNumber() {
        return candidateIdNumber;
    }
    
    public void setCandidateIdNumber(String candidateIdNumber) {
        this.candidateIdNumber = candidateIdNumber;
    }
    
    public String getCandidatePhoto() {
        return candidatePhoto;
    }
    
    public void setCandidatePhoto(String candidatePhoto) {
        this.candidatePhoto = candidatePhoto;
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
    
    public String getQrCode() {
        return qrCode;
    }
    
    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }
    
    public String getBarcode() {
        return barcode;
    }
    
    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }
    
    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }
    
    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }
    
    public LocalDateTime getPrintedAt() {
        return printedAt;
    }
    
    public void setPrintedAt(LocalDateTime printedAt) {
        this.printedAt = printedAt;
    }
    
    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }
    
    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
    
    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }
    
    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

