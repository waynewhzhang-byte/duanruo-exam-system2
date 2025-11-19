package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.VenueEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaVenueRepository extends JpaRepository<VenueEntity, UUID> {
    List<VenueEntity> findByExamId(UUID examId);
}

