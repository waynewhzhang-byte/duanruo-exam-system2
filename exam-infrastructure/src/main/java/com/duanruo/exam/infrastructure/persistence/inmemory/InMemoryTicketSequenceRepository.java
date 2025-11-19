package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.ticket.TicketSequenceRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryTicketSequenceRepository implements TicketSequenceRepository {
    private final Map<String, Long> counters = new ConcurrentHashMap<>();

    @Override
    public synchronized long next(ExamId examId, LocalDate date, boolean dailyReset, int startFrom) {
        String key = examId.getValue().toString() + (dailyReset ? (":" + date.toString()) : ":global");
        long current = counters.getOrDefault(key, (long) Math.max(0, startFrom - 1));
        long next = current + 1;
        counters.put(key, next);
        return next;
    }
}

