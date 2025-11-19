package com.duanruo.exam.infrastructure.persistence.mapper;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.ticket.Ticket;
import com.duanruo.exam.domain.ticket.TicketId;
import com.duanruo.exam.domain.ticket.TicketNo;
import com.duanruo.exam.infrastructure.persistence.entity.TicketEntity;
import org.springframework.stereotype.Component;

/**
 * 准考证映射器
 */
@Component
public class TicketMapper {
    
    /**
     * 领域对象转实体
     */
    public TicketEntity toEntity(Ticket ticket) {
        if (ticket == null) {
            return null;
        }
        
        TicketEntity entity = new TicketEntity();
        entity.setId(ticket.getId().getValue());
        entity.setApplicationId(ticket.getApplicationId().getValue());
        entity.setExamId(ticket.getExamId().getValue());
        entity.setPositionId(ticket.getPositionId().getValue());
        entity.setCandidateId(ticket.getCandidateId().getValue());
        entity.setTicketNo(ticket.getTicketNo().getValue());
        entity.setStatus(ticket.getStatus());
        
        entity.setCandidateName(ticket.getCandidateName());
        entity.setCandidateIdNumber(ticket.getCandidateIdNumber());
        entity.setCandidatePhoto(ticket.getCandidatePhoto());
        
        entity.setExamTitle(ticket.getExamTitle());
        entity.setPositionTitle(ticket.getPositionTitle());
        entity.setExamStartTime(ticket.getExamStartTime());
        entity.setExamEndTime(ticket.getExamEndTime());
        
        entity.setVenueName(ticket.getVenueName());
        entity.setRoomNumber(ticket.getRoomNumber());
        entity.setSeatNumber(ticket.getSeatNumber());
        
        entity.setQrCode(ticket.getQrCode());
        entity.setBarcode(ticket.getBarcode());
        
        entity.setIssuedAt(ticket.getIssuedAt());
        entity.setPrintedAt(ticket.getPrintedAt());
        entity.setVerifiedAt(ticket.getVerifiedAt());
        entity.setCancelledAt(ticket.getCancelledAt());
        entity.setCreatedAt(ticket.getCreatedAt());
        entity.setUpdatedAt(ticket.getUpdatedAt());
        
        return entity;
    }
    
    /**
     * 实体转领域对象
     */
    public Ticket toDomain(TicketEntity entity) {
        if (entity == null) {
            return null;
        }
        
        // 使用反射创建Ticket对象（因为构造函数是私有的）
        try {
            Ticket ticket = Ticket.class.getDeclaredConstructor().newInstance();
            
            // 设置ID
            java.lang.reflect.Method setIdMethod = Ticket.class.getSuperclass().getDeclaredMethod("setId", Object.class);
            setIdMethod.setAccessible(true);
            setIdMethod.invoke(ticket, TicketId.of(entity.getId()));
            
            // 设置字段
            setField(ticket, "applicationId", ApplicationId.of(entity.getApplicationId()));
            setField(ticket, "examId", ExamId.of(entity.getExamId()));
            setField(ticket, "positionId", PositionId.of(entity.getPositionId()));
            setField(ticket, "candidateId", CandidateId.of(entity.getCandidateId()));
            setField(ticket, "ticketNo", TicketNo.of(entity.getTicketNo()));
            setField(ticket, "status", entity.getStatus());
            
            setField(ticket, "candidateName", entity.getCandidateName());
            setField(ticket, "candidateIdNumber", entity.getCandidateIdNumber());
            setField(ticket, "candidatePhoto", entity.getCandidatePhoto());
            
            setField(ticket, "examTitle", entity.getExamTitle());
            setField(ticket, "positionTitle", entity.getPositionTitle());
            setField(ticket, "examStartTime", entity.getExamStartTime());
            setField(ticket, "examEndTime", entity.getExamEndTime());
            
            setField(ticket, "venueName", entity.getVenueName());
            setField(ticket, "roomNumber", entity.getRoomNumber());
            setField(ticket, "seatNumber", entity.getSeatNumber());
            
            setField(ticket, "qrCode", entity.getQrCode());
            setField(ticket, "barcode", entity.getBarcode());
            
            setField(ticket, "issuedAt", entity.getIssuedAt());
            setField(ticket, "printedAt", entity.getPrintedAt());
            setField(ticket, "verifiedAt", entity.getVerifiedAt());
            setField(ticket, "cancelledAt", entity.getCancelledAt());
            setField(ticket, "createdAt", entity.getCreatedAt());
            setField(ticket, "updatedAt", entity.getUpdatedAt());
            
            return ticket;
        } catch (Exception e) {
            throw new RuntimeException("Failed to map TicketEntity to Ticket", e);
        }
    }
    
    /**
     * 使用反射设置私有字段
     */
    private void setField(Ticket ticket, String fieldName, Object value) throws Exception {
        java.lang.reflect.Field field = Ticket.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(ticket, value);
    }
}

