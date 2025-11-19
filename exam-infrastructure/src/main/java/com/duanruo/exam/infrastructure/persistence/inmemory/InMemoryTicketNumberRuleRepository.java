package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.ticket.TicketNumberRule;
import com.duanruo.exam.domain.ticket.TicketNumberRuleRepository;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryTicketNumberRuleRepository implements TicketNumberRuleRepository {
    private final Map<ExamId, TicketNumberRule> store = new ConcurrentHashMap<>();

    @Override
    public Optional<TicketNumberRule> findByExamId(ExamId examId) {
        return Optional.ofNullable(store.get(examId));
    }

    @Override
    public void save(TicketNumberRule rule) {
        store.put(rule.getExamId(), rule);
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        store.remove(examId);
    }
}

