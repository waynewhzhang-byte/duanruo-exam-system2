package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.exam.ExamId;

import java.util.Optional;

public interface TicketNumberRuleRepository {
    Optional<TicketNumberRule> findByExamId(ExamId examId);
    void save(TicketNumberRule rule);
    void deleteByExamId(ExamId examId);
}

