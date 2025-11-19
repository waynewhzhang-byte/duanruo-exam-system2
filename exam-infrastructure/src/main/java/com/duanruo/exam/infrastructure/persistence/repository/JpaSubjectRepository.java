package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JpaSubjectRepository extends JpaRepository<SubjectEntity, UUID> {
    List<SubjectEntity> findByPositionId(UUID positionId);
    void deleteByPositionId(UUID positionId);
}

