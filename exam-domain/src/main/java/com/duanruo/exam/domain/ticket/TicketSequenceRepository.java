package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.exam.ExamId;

import java.time.LocalDate;

public interface TicketSequenceRepository {
    long next(ExamId examId, LocalDate date, boolean dailyReset, int startFrom);
}

