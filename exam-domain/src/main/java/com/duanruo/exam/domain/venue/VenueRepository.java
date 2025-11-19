package com.duanruo.exam.domain.venue;

import com.duanruo.exam.domain.exam.ExamId;

import java.util.List;
import java.util.Optional;

/**
 * Domain Port: Venue Repository
 */
public interface VenueRepository {
    void save(Venue venue);
    Optional<Venue> findById(VenueId id);
    List<Venue> findByExamId(ExamId examId);
    void delete(VenueId id);
    void deleteByExamId(ExamId examId);
}

