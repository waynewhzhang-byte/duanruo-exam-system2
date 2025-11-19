package com.duanruo.exam.infrastructure.persistence.entity;

import com.duanruo.exam.domain.ticket.TicketStatus;
import com.duanruo.exam.infrastructure.security.AESAttributeConverter;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 准考证JPA实体
 */
@Entity
@Table(name = "tickets")
public class TicketEntity {
    
    @Id
    private UUID id;
    
    @Column(name = "application_id", nullable = false)
    private UUID applicationId;
    
    @Column(name = "exam_id", nullable = false)
    private UUID examId;
    
    @Column(name = "position_id", nullable = false)
    private UUID positionId;
    
    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;
    
    @Column(name = "ticket_no", nullable = false, unique = true, length = 100)
    private String ticketNo;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TicketStatus status;
    
    // 考生信息
    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "candidate_name", length = 500)
    private String candidateName;

    @Convert(converter = AESAttributeConverter.class)
    @Column(name = "candidate_id_number", length = 500)
    private String candidateIdNumber;
    
    @Column(name = "candidate_photo", length = 500)
    private String candidatePhoto;
    
    // 考试信息
    @Column(name = "exam_title", length = 200)
    private String examTitle;
    
    @Column(name = "position_title", length = 200)
    private String positionTitle;
    
    @Column(name = "exam_start_time")
    private LocalDateTime examStartTime;
    
    @Column(name = "exam_end_time")
    private LocalDateTime examEndTime;
    
    // 考场信息
    @Column(name = "venue_name", length = 200)
    private String venueName;
    
    @Column(name = "room_number", length = 50)
    private String roomNumber;
    
    @Column(name = "seat_number", length = 50)
    private String seatNumber;
    
    // 二维码和条形码
    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;
    
    @Column(name = "barcode", length = 100)
    private String barcode;
    
    // 时间戳
    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;
    
    @Column(name = "printed_at")
    private LocalDateTime printedAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
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

