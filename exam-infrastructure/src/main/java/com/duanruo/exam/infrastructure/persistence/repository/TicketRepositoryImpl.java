package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.ticket.Ticket;
import com.duanruo.exam.domain.ticket.TicketId;
import com.duanruo.exam.domain.ticket.TicketNo;
import com.duanruo.exam.domain.ticket.TicketRepository;
import com.duanruo.exam.domain.ticket.TicketStatus;
import com.duanruo.exam.infrastructure.persistence.entity.TicketEntity;
import com.duanruo.exam.infrastructure.persistence.mapper.TicketMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 准考证仓储实现
 */
@Repository
public class TicketRepositoryImpl implements TicketRepository {
    
    private final JpaTicketRepository jpaRepository;
    private final TicketMapper mapper;
    
    public TicketRepositoryImpl(JpaTicketRepository jpaRepository, TicketMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }
    
    @Override
    public void save(Ticket ticket) {
        TicketEntity entity = mapper.toEntity(ticket);
        jpaRepository.save(entity);
    }
    
    @Override
    public Optional<Ticket> findById(TicketId id) {
        return jpaRepository.findById(id.getValue())
                .map(mapper::toDomain);
    }
    
    @Override
    public Optional<Ticket> findByTicketNo(TicketNo ticketNo) {
        return jpaRepository.findByTicketNo(ticketNo.getValue())
                .map(mapper::toDomain);
    }
    
    @Override
    public Optional<Ticket> findByApplicationId(ApplicationId applicationId) {
        return jpaRepository.findByApplicationId(applicationId.getValue())
                .map(mapper::toDomain);
    }
    
    @Override
    public List<Ticket> findByExamId(ExamId examId) {
        return jpaRepository.findByExamId(examId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Ticket> findByExamIdAndStatus(ExamId examId, TicketStatus status) {
        return jpaRepository.findByExamIdAndStatus(examId.getValue(), status).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public long countByExamId(ExamId examId) {
        return jpaRepository.countByExamId(examId.getValue());
    }
    
    @Override
    public long countByExamIdAndStatus(ExamId examId, TicketStatus status) {
        return jpaRepository.countByExamIdAndStatus(examId.getValue(), status);
    }
    
    @Override
    public boolean existsByTicketNo(TicketNo ticketNo) {
        return jpaRepository.existsByTicketNo(ticketNo.getValue());
    }
    
    @Override
    public void delete(TicketId id) {
        jpaRepository.deleteById(id.getValue());
    }
}

