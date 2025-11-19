package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.TicketNumberRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JpaTicketNumberRuleRepository extends JpaRepository<TicketNumberRuleEntity, UUID> {
    Optional<TicketNumberRuleEntity> findByExamId(UUID examId);
    void deleteByExamId(UUID examId);
}

