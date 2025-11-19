package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueId;
import com.duanruo.exam.domain.venue.VenueRepository;
import com.duanruo.exam.infrastructure.persistence.entity.VenueEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Primary
public class VenueRepositoryImpl implements VenueRepository {

    private final JpaVenueRepository jpa;
    private final ObjectMapper jsonMapper = JsonMapper.builder().build();

    public VenueRepositoryImpl(JpaVenueRepository jpa) { this.jpa = jpa; }

    @Override
    public void save(Venue venue) {
        VenueEntity e = toEntity(venue);
        jpa.save(e);
    }

    @Override
    public Optional<Venue> findById(VenueId id) {
        return jpa.findById(id.getValue()).map(this::toDomain);
    }

    @Override
    public List<Venue> findByExamId(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public void delete(VenueId id) { jpa.deleteById(id.getValue()); }

    @Override
    public void deleteByExamId(ExamId examId) {
        jpa.findByExamId(examId.getValue()).forEach(v -> jpa.deleteById(v.getId()));
    }

    private VenueEntity toEntity(Venue v) {
        VenueEntity e = new VenueEntity(v.getId().getValue(), v.getExamId().getValue(), v.getName(), v.getCapacity());
        try {
            e.setSeatMapJson(v.getSeatMapJson() == null ? null : jsonMapper.readTree(v.getSeatMapJson()));
        } catch (Exception ex) {
            e.setSeatMapJson(null);
        }
        e.setCreatedAt(v.getCreatedAt());
        e.setUpdatedAt(v.getUpdatedAt());
        return e;
    }

    private Venue toDomain(VenueEntity e) {
        String seatMap = null;
        try {
            seatMap = e.getSeatMapJson() == null ? null : jsonMapper.writeValueAsString(e.getSeatMapJson());
        } catch (Exception ex) {
            seatMap = null;
        }
        return Venue.rebuild(VenueId.of(e.getId()), ExamId.of(e.getExamId()), e.getName(), e.getCapacity(),
                seatMap, e.getCreatedAt(), e.getUpdatedAt());
    }
}

