package com.duanruo.exam.adapter.scheduler;

import com.duanruo.exam.application.service.SeatingApplicationService;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.exam.ExamStatus;
import com.duanruo.exam.domain.seating.SeatAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutoSeatingSchedulerTest {

    @Mock ExamRepository examRepository;
    @Mock SeatAssignmentRepository seatAssignmentRepository;
    @Mock SeatingApplicationService seatingService;

    @InjectMocks AutoSeatingScheduler scheduler;

    @Test
    void should_allocate_and_issue_for_closed_exam_without_assignments() {
        // arrange
        var examId = ExamId.of(UUID.randomUUID());
        Exam closedExam = Exam.rebuild(
                examId,
                "EX-001",
                "Exam Title",
                "desc",
                null,
                LocalDateTime.now().minusDays(10),
                LocalDateTime.now().minusDays(1),
                false,
                null,
                null,
                ExamStatus.CLOSED,
                "admin",
                LocalDateTime.now().minusDays(20),
                LocalDateTime.now().minusDays(1)
        );
        when(examRepository.findByStatus(ExamStatus.CLOSED)).thenReturn(List.of(closedExam));
        when(seatAssignmentRepository.findByExamId(examId)).thenReturn(Collections.emptyList());
        when(seatingService.allocateSeats(eq(examId.getValue()), anyString()))
                .thenReturn(new SeatingApplicationService.AllocationResult(UUID.randomUUID(), 10, 10, 1));
        when(seatingService.issueTickets(eq(examId.getValue())))
                .thenReturn(new SeatingApplicationService.IssueResult(10, 10));

        // act
        scheduler.runAutoSeating();

        // assert
        verify(seatingService, times(1)).allocateSeats(eq(examId.getValue()), ArgumentMatchers.anyString());
        verify(seatingService, times(1)).issueTickets(eq(examId.getValue()));
    }

    @Test
    void should_skip_allocate_when_assignments_exist_but_still_issue() {
        var examId = ExamId.of(UUID.randomUUID());
        Exam closedExam = Exam.rebuild(
                examId,
                "EX-002",
                "Exam Title",
                "desc",
                null,
                LocalDateTime.now().minusDays(10),
                LocalDateTime.now().minusDays(1),
                true,
                java.math.BigDecimal.valueOf(100),
                null,
                ExamStatus.CLOSED,
                "admin",
                LocalDateTime.now().minusDays(20),
                LocalDateTime.now().minusDays(1)
        );
        when(examRepository.findByStatus(ExamStatus.CLOSED)).thenReturn(List.of(closedExam));
        // non-empty assignments -> skip allocation
        when(seatAssignmentRepository.findByExamId(examId)).thenReturn(List.of(mock(com.duanruo.exam.domain.seating.SeatAssignment.class)));
        when(seatingService.issueTickets(eq(examId.getValue())))
                .thenReturn(new SeatingApplicationService.IssueResult(5, 2));

        scheduler.runAutoSeating();

        verify(seatingService, never()).allocateSeats(any(), anyString());
        verify(seatingService, times(1)).issueTickets(eq(examId.getValue()));
    }
}

