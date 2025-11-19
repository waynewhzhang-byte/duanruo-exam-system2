package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity;
import com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity.StageEntity;
import com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity.StatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JpaReviewTaskRepository extends JpaRepository<ReviewTaskEntity, UUID> {

    List<ReviewTaskEntity> findByAssignedToAndStatus(UUID assignedTo, StatusEntity status);

    @Query("select t from ReviewTaskEntity t where t.applicationId = :appId and t.stage = :stage and t.status in (:s1, :s2) order by t.createdAt asc")
    List<ReviewTaskEntity> findActiveCandidates(@Param("appId") UUID applicationId,
                                                @Param("stage") StageEntity stage,
                                                @Param("s1") StatusEntity s1,
                                                @Param("s2") StatusEntity s2);

    @Query(value = "select * from review_tasks t where t.application_id = :appId and t.stage = :stage and (t.status = 'OPEN' or (t.status = 'ASSIGNED' and t.locked_at is not null and t.locked_at + (:ttlMinutes || ' minutes')::interval > now())) order by t.created_at asc limit 1", nativeQuery = true)
    Optional<ReviewTaskEntity> findOneActiveNotExpired(@Param("appId") UUID applicationId,
                                                       @Param("stage") String stage,
                                                       @Param("ttlMinutes") int ttlMinutes);

    Optional<ReviewTaskEntity> findById(UUID id);

    // Admin/all queries
    List<ReviewTaskEntity> findByStatus(StatusEntity status);
    List<ReviewTaskEntity> findByStatusAndStage(StatusEntity status, StageEntity stage);

    // Open tasks by associated exams
    @Query("select t from ReviewTaskEntity t, ApplicationEntity a where a.id = t.applicationId and a.examId in :examIds and t.status = com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity$StatusEntity.OPEN order by t.createdAt asc")
    List<ReviewTaskEntity> findOpenByExamIds(@Param("examIds") List<UUID> examIds);

    @Query("select t from ReviewTaskEntity t, ApplicationEntity a where a.id = t.applicationId and a.examId in :examIds and t.status = com.duanruo.exam.infrastructure.persistence.entity.ReviewTaskEntity$StatusEntity.OPEN and t.stage = :stage order by t.createdAt asc")
    List<ReviewTaskEntity> findOpenByExamIdsAndStage(@Param("examIds") List<UUID> examIds, @Param("stage") StageEntity stage);
}

