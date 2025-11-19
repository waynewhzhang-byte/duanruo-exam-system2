package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.infrastructure.persistence.entity.ApplicationAuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface JpaApplicationAuditLogRepository extends JpaRepository<ApplicationAuditLogEntity, UUID> {
    List<ApplicationAuditLogEntity> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    @Query("select count(l) from ApplicationAuditLogEntity l where l.actor = :actor and l.toStatus in :statuses and l.createdAt >= :start and l.createdAt < :end")
    long countProcessedByActorBetween(@Param("actor") String actor,
                                      @Param("statuses") Collection<ApplicationStatus> statuses,
                                      @Param("start") LocalDateTime start,
                                      @Param("end") LocalDateTime end);
}

