package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.shared.domain.AggregateRoot;

import java.time.LocalDateTime;

/**
 * 准考证聚合根
 */
public class Ticket extends AggregateRoot<TicketId> {
    
    private ApplicationId applicationId;
    private ExamId examId;
    private PositionId positionId;
    private CandidateId candidateId;
    private TicketNo ticketNo;
    private TicketStatus status;
    
    // 考生信息（冗余存储，避免查询）
    private String candidateName;
    private String candidateIdNumber;
    private String candidatePhoto;
    
    // 考试信息（冗余存储）
    private String examTitle;
    private String positionTitle;
    private LocalDateTime examStartTime;
    private LocalDateTime examEndTime;
    
    // 考场信息（可选）
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
    
    // 私有构造函数
    private Ticket() {
        super();
    }
    
    /**
     * 创建准考证
     */
    public static Ticket create(
            ApplicationId applicationId,
            ExamId examId,
            PositionId positionId,
            CandidateId candidateId,
            TicketNo ticketNo,
            String candidateName,
            String candidateIdNumber,
            String examTitle,
            String positionTitle) {
        
        if (applicationId == null) {
            throw new IllegalArgumentException("applicationId不能为空");
        }
        if (examId == null) {
            throw new IllegalArgumentException("examId不能为空");
        }
        if (positionId == null) {
            throw new IllegalArgumentException("positionId不能为空");
        }
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId不能为空");
        }
        if (ticketNo == null) {
            throw new IllegalArgumentException("ticketNo不能为空");
        }
        
        Ticket ticket = new Ticket();
        ticket.setId(TicketId.generate());
        ticket.applicationId = applicationId;
        ticket.examId = examId;
        ticket.positionId = positionId;
        ticket.candidateId = candidateId;
        ticket.ticketNo = ticketNo;
        ticket.status = TicketStatus.ISSUED;
        
        ticket.candidateName = candidateName;
        ticket.candidateIdNumber = candidateIdNumber;
        ticket.examTitle = examTitle;
        ticket.positionTitle = positionTitle;
        
        // 生成二维码和条形码内容
        ticket.qrCode = generateQRCode(ticketNo.getValue());
        ticket.barcode = ticketNo.getValue().replace("-", "");
        
        LocalDateTime now = LocalDateTime.now();
        ticket.issuedAt = now;
        ticket.createdAt = now;
        ticket.updatedAt = now;
        
        return ticket;
    }
    
    /**
     * 标记为已打印
     */
    public void markAsPrinted() {
        if (!status.canTransitionTo(TicketStatus.PRINTED)) {
            throw new IllegalStateException("准考证状态不允许转换为已打印");
        }

        this.status = TicketStatus.PRINTED;
        this.printedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 标记为已验证
     */
    public void markAsVerified() {
        if (!status.canTransitionTo(TicketStatus.VERIFIED)) {
            throw new IllegalStateException("准考证状态不允许转换为已验证");
        }

        this.status = TicketStatus.VERIFIED;
        this.verifiedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 取消准考证
     */
    public void cancel() {
        if (!status.canTransitionTo(TicketStatus.CANCELLED)) {
            throw new IllegalStateException("准考证状态不允许转换为已取消");
        }

        this.status = TicketStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 设置考场信息
     */
    public void setVenueInfo(String venueName, String roomNumber, String seatNumber) {
        this.venueName = venueName;
        this.roomNumber = roomNumber;
        this.seatNumber = seatNumber;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 设置考试时间
     */
    public void setExamTime(LocalDateTime startTime, LocalDateTime endTime) {
        this.examStartTime = startTime;
        this.examEndTime = endTime;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 设置考生照片
     */
    public void setCandidatePhoto(String photoUrl) {
        this.candidatePhoto = photoUrl;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 生成二维码内容
     */
    private static String generateQRCode(String ticketNumber) {
        // 简化实现：返回准考证号
        // 实际应该包含更多信息，如考试ID、考生ID等
        return ticketNumber;
    }
    
    /**
     * 验证准考证是否有效
     */
    public boolean isValid() {
        return status != TicketStatus.CANCELLED;
    }
    
    // Getters
    public ApplicationId getApplicationId() {
        return applicationId;
    }
    
    public ExamId getExamId() {
        return examId;
    }
    
    public PositionId getPositionId() {
        return positionId;
    }
    
    public CandidateId getCandidateId() {
        return candidateId;
    }
    
    public TicketNo getTicketNo() {
        return ticketNo;
    }
    
    public TicketStatus getStatus() {
        return status;
    }
    
    public String getCandidateName() {
        return candidateName;
    }
    
    public String getCandidateIdNumber() {
        return candidateIdNumber;
    }
    
    public String getCandidatePhoto() {
        return candidatePhoto;
    }
    
    public String getExamTitle() {
        return examTitle;
    }
    
    public String getPositionTitle() {
        return positionTitle;
    }
    
    public LocalDateTime getExamStartTime() {
        return examStartTime;
    }
    
    public LocalDateTime getExamEndTime() {
        return examEndTime;
    }
    
    public String getVenueName() {
        return venueName;
    }
    
    public String getRoomNumber() {
        return roomNumber;
    }
    
    public String getSeatNumber() {
        return seatNumber;
    }
    
    public String getQrCode() {
        return qrCode;
    }
    
    public String getBarcode() {
        return barcode;
    }
    
    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }
    
    public LocalDateTime getPrintedAt() {
        return printedAt;
    }
    
    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }
    
    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

