package com.duanruo.exam.infrastructure.seating;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationStatus;
import com.duanruo.exam.domain.candidate.CandidateId;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.seating.AllocationStrategy;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueId;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 座位分配服务测试
 */
class SeatAllocationServiceImplTest {

    private SeatAllocationServiceImpl service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new SeatAllocationServiceImpl(objectMapper);
    }

    @Test
    void allocate_shouldUsePositionFirstSubmittedAtStrategy_whenDefaultStrategy() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        PositionId position2 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        Application app1 = createApplication(examId, position1, LocalDateTime.now().minusDays(3));
        Application app2 = createApplication(examId, position1, LocalDateTime.now().minusDays(2));
        Application app3 = createApplication(examId, position2, LocalDateTime.now().minusDays(1));
        Application app4 = createApplication(examId, position2, LocalDateTime.now());

        List<Application> applications = Arrays.asList(app1, app2, app3, app4);

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 10)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.POSITION_FIRST_SUBMITTED_AT,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertEquals(4, assignments.size());
        // 验证所有考生都被分配了座位
        Set<UUID> assignedAppIds = new HashSet<>();
        for (SeatAssignment assignment : assignments) {
            assignedAppIds.add(assignment.getApplicationId().getValue());
        }
        assertEquals(4, assignedAppIds.size());

        // 验证同一岗位的考生被分配在一起（按岗位分组）
        // 由于岗位1有2个考生，岗位2有2个考生，且岗位1和岗位2人数相同
        // 我们只验证前2个和后2个的岗位ID相同即可
        UUID firstPositionId = assignments.get(0).getPositionId().getValue();
        UUID secondPositionId = assignments.get(2).getPositionId().getValue();

        assertEquals(firstPositionId, assignments.get(1).getPositionId().getValue());
        assertEquals(secondPositionId, assignments.get(3).getPositionId().getValue());
        assertNotEquals(firstPositionId, secondPositionId);
    }

    @Test
    void allocate_shouldRandomizeOrder_whenRandomStrategy() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        List<Application> applications = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            applications.add(createApplication(examId, position1, LocalDateTime.now().minusDays(i)));
        }

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 20)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.RANDOM,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertEquals(10, assignments.size());
        // 验证所有考生都被分配了座位
        Set<UUID> assignedAppIds = new HashSet<>();
        for (SeatAssignment assignment : assignments) {
            assignedAppIds.add(assignment.getApplicationId().getValue());
        }
        assertEquals(10, assignedAppIds.size());
    }

    @Test
    void allocate_shouldSortBySubmittedAt_whenSubmittedAtFirstStrategy() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        PositionId position2 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        LocalDateTime time1 = LocalDateTime.now().minusDays(5);
        LocalDateTime time2 = LocalDateTime.now().minusDays(3);
        LocalDateTime time3 = LocalDateTime.now().minusDays(1);

        Application app1 = createApplication(examId, position2, time2);
        Application app2 = createApplication(examId, position1, time1);
        Application app3 = createApplication(examId, position2, time3);

        List<Application> applications = Arrays.asList(app1, app2, app3);

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 10)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.SUBMITTED_AT_FIRST,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertEquals(3, assignments.size());
        // 验证按提交时间排序（最早的在前）
        assertEquals(app2.getId(), assignments.get(0).getApplicationId());
        assertEquals(app1.getId(), assignments.get(1).getApplicationId());
        assertEquals(app3.getId(), assignments.get(2).getApplicationId());
    }

    @Test
    void allocate_shouldGroupByPositionAndRandomize_whenPositionFirstRandomStrategy() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        PositionId position2 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        List<Application> applications = Arrays.asList(
                createApplication(examId, position1, LocalDateTime.now().minusDays(5)),
                createApplication(examId, position1, LocalDateTime.now().minusDays(4)),
                createApplication(examId, position1, LocalDateTime.now().minusDays(3)),
                createApplication(examId, position2, LocalDateTime.now().minusDays(2)),
                createApplication(examId, position2, LocalDateTime.now().minusDays(1))
        );

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 10)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.POSITION_FIRST_RANDOM,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertEquals(5, assignments.size());
        // 验证同一岗位的考生被分配在一起（但顺序是随机的）
        Set<PositionId> firstThreePositions = new HashSet<>();
        firstThreePositions.add(assignments.get(0).getPositionId());
        firstThreePositions.add(assignments.get(1).getPositionId());
        firstThreePositions.add(assignments.get(2).getPositionId());
        assertEquals(1, firstThreePositions.size()); // 前3个应该是同一岗位

        Set<PositionId> lastTwoPositions = new HashSet<>();
        lastTwoPositions.add(assignments.get(3).getPositionId());
        lastTwoPositions.add(assignments.get(4).getPositionId());
        assertEquals(1, lastTwoPositions.size()); // 后2个应该是同一岗位
    }

    @Test
    void allocate_shouldGroupByCustomField_whenCustomGroupStrategy() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        Application app1 = createApplicationWithPayload(examId, position1, LocalDateTime.now().minusDays(3), "{\"graduationSchool\":\"清华大学\"}");
        Application app2 = createApplicationWithPayload(examId, position1, LocalDateTime.now().minusDays(2), "{\"graduationSchool\":\"清华大学\"}");
        Application app3 = createApplicationWithPayload(examId, position1, LocalDateTime.now().minusDays(1), "{\"graduationSchool\":\"北京大学\"}");

        List<Application> applications = Arrays.asList(app1, app2, app3);

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 10)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.CUSTOM_GROUP,
                applications,
                venues,
                batchId,
                "graduationSchool"
        );

        // Assert
        assertEquals(3, assignments.size());
        // 验证相同学校的考生被分配在一起
        // 清华大学的考生应该在前面（因为人数更多）
        assertEquals(app1.getId(), assignments.get(0).getApplicationId());
        assertEquals(app2.getId(), assignments.get(1).getApplicationId());
        assertEquals(app3.getId(), assignments.get(2).getApplicationId());
    }

    @Test
    void allocate_shouldHandleMultipleVenues_whenCapacityExceeded() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();

        List<Application> applications = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            applications.add(createApplication(examId, position1, LocalDateTime.now().minusDays(i)));
        }

        List<Venue> venues = Arrays.asList(
                createVenue(examId, 10),
                createVenue(examId, 5)
        );

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.POSITION_FIRST_SUBMITTED_AT,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertEquals(15, assignments.size());
        // 验证座位号的分配
        Map<VenueId, Integer> venueAssignments = new HashMap<>();
        for (SeatAssignment assignment : assignments) {
            venueAssignments.put(assignment.getVenueId(), 
                    venueAssignments.getOrDefault(assignment.getVenueId(), 0) + 1);
        }
        assertEquals(2, venueAssignments.size()); // 使用了2个考场
    }

    @Test
    void allocate_shouldReturnEmpty_whenNoApplications() {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();
        List<Application> applications = Collections.emptyList();
        List<Venue> venues = Arrays.asList(createVenue(examId, 10));

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.POSITION_FIRST_SUBMITTED_AT,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertTrue(assignments.isEmpty());
    }

    @Test
    void allocate_shouldReturnEmpty_whenNoVenues() throws Exception {
        // Arrange
        ExamId examId = ExamId.of(UUID.randomUUID());
        PositionId position1 = PositionId.of(UUID.randomUUID());
        UUID batchId = UUID.randomUUID();
        List<Application> applications = Arrays.asList(
                createApplication(examId, position1, LocalDateTime.now())
        );
        List<Venue> venues = Collections.emptyList();

        // Act
        List<SeatAssignment> assignments = service.allocate(
                AllocationStrategy.POSITION_FIRST_SUBMITTED_AT,
                applications,
                venues,
                batchId,
                null
        );

        // Assert
        assertTrue(assignments.isEmpty());
    }

    // Helper methods

    private Application createApplication(ExamId examId, PositionId positionId, LocalDateTime submittedAt) throws Exception {
        return createApplicationWithPayload(examId, positionId, submittedAt, "{}");
    }

    private Application createApplicationWithPayload(ExamId examId, PositionId positionId, LocalDateTime submittedAt, String payload) throws Exception {
        Application app = Application.create(examId, positionId, CandidateId.of(UUID.randomUUID()));
        
        // 使用反射设置私有字段
        setField(app, "id", ApplicationId.of(UUID.randomUUID()));
        setField(app, "payload", payload);
        setField(app, "status", ApplicationStatus.PAID);
        setField(app, "submittedAt", submittedAt);
        
        return app;
    }

    private Venue createVenue(ExamId examId, int capacity) {
        return Venue.create(examId, "考场-" + UUID.randomUUID(), capacity);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}

