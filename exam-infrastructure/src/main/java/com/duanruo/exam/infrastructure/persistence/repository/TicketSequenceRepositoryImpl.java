package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.ticket.TicketSequenceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
@Primary
public class TicketSequenceRepositoryImpl implements TicketSequenceRepository {

    @PersistenceContext
    private EntityManager em;

    private static final LocalDate GLOBAL_DATE = LocalDate.of(1, 1, 1); // '0001-01-01'

    @Override
    @Transactional
    public long next(ExamId examId, LocalDate date, boolean dailyReset, int startFrom) {
        String scope = dailyReset ? "DAILY" : "GLOBAL";
        LocalDate counterDate = dailyReset ? date : GLOBAL_DATE;
        String sql = "INSERT INTO ticket_sequences(exam_id, scope, counter_date, current_value) " +
                "VALUES (:examId, :scope, :counterDate, GREATEST(:startFrom - 1, 0) + 1) " +
                "ON CONFLICT (exam_id, scope, counter_date) DO UPDATE SET current_value = ticket_sequences.current_value + 1 " +
                "RETURNING current_value";
        Number n = (Number) em.createNativeQuery(sql)
                .setParameter("examId", examId.getValue())
                .setParameter("scope", scope)
                .setParameter("counterDate", counterDate)
                .setParameter("startFrom", startFrom)
                .getSingleResult();
        return n.longValue();
    }
}

