package com.duanruo.exam.infrastructure.persistence.inmemory;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueId;
import com.duanruo.exam.domain.venue.VenueRepository;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryVenueRepository implements VenueRepository {
    private final Map<VenueId, Venue> store = new ConcurrentHashMap<>();

    @Override
    public void save(Venue venue) {
        store.put(venue.getId(), venue);
    }

    @Override
    public Optional<Venue> findById(VenueId id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Venue> findByExamId(ExamId examId) {
        return store.values().stream().filter(v -> v.getExamId().equals(examId)).collect(Collectors.toList());
    }

    @Override
    public void delete(VenueId id) {
        store.remove(id);
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        store.values().removeIf(v -> v.getExamId().equals(examId));
    }
}

