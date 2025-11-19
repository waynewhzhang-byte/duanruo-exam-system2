package com.duanruo.exam.infrastructure.seating;

import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.exam.PositionId;
import com.duanruo.exam.domain.seating.AllocationStrategy;
import com.duanruo.exam.domain.seating.SeatAllocationService;
import com.duanruo.exam.domain.seating.SeatAssignment;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueId;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 座位分配领域服务实现
 */
@Service
public class SeatAllocationServiceImpl implements SeatAllocationService {

    private final ObjectMapper objectMapper;

    public SeatAllocationServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<SeatAssignment> allocate(
            AllocationStrategy strategy,
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            String customGroupField
    ) {
        if (applications.isEmpty() || venues.isEmpty()) {
            return Collections.emptyList();
        }

        // 按容量降序排序考场
        List<Venue> sortedVenues = new ArrayList<>(venues);
        sortedVenues.sort(Comparator.comparing(Venue::getCapacity, 
                Comparator.nullsLast(Integer::compareTo)).reversed());

        // 初始化考场剩余容量和已分配计数
        Map<VenueId, Integer> remaining = new HashMap<>();
        Map<VenueId, Integer> assignedCount = new HashMap<>();
        for (Venue v : sortedVenues) {
            remaining.put(v.getId(), v.getCapacity());
            assignedCount.put(v.getId(), 0);
        }

        List<SeatAssignment> assignments = new ArrayList<>();

        switch (strategy) {
            case RANDOM:
                assignments = allocateRandom(applications, sortedVenues, batchId, remaining, assignedCount);
                break;
            case SUBMITTED_AT_FIRST:
                assignments = allocateBySubmittedAt(applications, sortedVenues, batchId, remaining, assignedCount);
                break;
            case POSITION_FIRST_RANDOM:
                assignments = allocatePositionFirstRandom(applications, sortedVenues, batchId, remaining, assignedCount);
                break;
            case CUSTOM_GROUP:
                assignments = allocateByCustomGroup(applications, sortedVenues, batchId, remaining, assignedCount, customGroupField);
                break;
            case POSITION_FIRST_SUBMITTED_AT:
            default:
                assignments = allocatePositionFirstSubmittedAt(applications, sortedVenues, batchId, remaining, assignedCount);
                break;
        }

        return assignments;
    }

    /**
     * 策略1: 按岗位分组 + 按提交时间排序（默认策略）
     */
    private List<SeatAssignment> allocatePositionFirstSubmittedAt(
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            Map<VenueId, Integer> remaining,
            Map<VenueId, Integer> assignedCount
    ) {
        List<SeatAssignment> assignments = new ArrayList<>();

        // 按岗位分组
        Map<PositionId, List<Application>> byPosition = applications.stream()
                .collect(Collectors.groupingBy(Application::getPositionId));

        // 按组大小降序排序
        List<Map.Entry<PositionId, List<Application>>> groups = new ArrayList<>(byPosition.entrySet());
        groups.sort((e1, e2) -> Integer.compare(e2.getValue().size(), e1.getValue().size()));

        for (var entry : groups) {
            // 组内按提交时间升序排序
            List<Application> apps = new ArrayList<>(entry.getValue());
            apps.sort(Comparator.comparing(a -> 
                    Optional.ofNullable(a.getSubmittedAt()).orElse(LocalDateTime.MIN)));

            // 尽量将同一岗位的考生安排在同一考场
            VenueId preferred = null;
            for (Application app : apps) {
                VenueId chosen = preferred;
                if (chosen == null || remaining.getOrDefault(chosen, 0) <= 0) {
                    // 找到第一个有剩余容量的考场
                    chosen = venues.stream()
                            .map(Venue::getId)
                            .filter(id -> remaining.getOrDefault(id, 0) > 0)
                            .findFirst()
                            .orElse(null);
                }
                if (chosen == null) {
                    break; // 没有剩余容量
                }
                if (preferred == null) preferred = chosen;

                int count = assignedCount.get(chosen) + 1;
                assignedCount.put(chosen, count);
                remaining.put(chosen, remaining.get(chosen) - 1);
                assignments.add(SeatAssignment.create(
                        app.getExamId(), app.getPositionId(), app.getId(), chosen, count, batchId));
            }
        }

        return assignments;
    }

    /**
     * 策略2: 完全随机分配
     */
    private List<SeatAssignment> allocateRandom(
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            Map<VenueId, Integer> remaining,
            Map<VenueId, Integer> assignedCount
    ) {
        List<SeatAssignment> assignments = new ArrayList<>();

        // 随机打乱考生顺序
        List<Application> shuffled = new ArrayList<>(applications);
        Collections.shuffle(shuffled, new Random());

        for (Application app : shuffled) {
            // 找到第一个有剩余容量的考场
            VenueId chosen = venues.stream()
                    .map(Venue::getId)
                    .filter(id -> remaining.getOrDefault(id, 0) > 0)
                    .findFirst()
                    .orElse(null);

            if (chosen == null) {
                break; // 没有剩余容量
            }

            int count = assignedCount.get(chosen) + 1;
            assignedCount.put(chosen, count);
            remaining.put(chosen, remaining.get(chosen) - 1);
            assignments.add(SeatAssignment.create(
                    app.getExamId(), app.getPositionId(), app.getId(), chosen, count, batchId));
        }

        return assignments;
    }

    /**
     * 策略3: 按报名时间优先
     */
    private List<SeatAssignment> allocateBySubmittedAt(
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            Map<VenueId, Integer> remaining,
            Map<VenueId, Integer> assignedCount
    ) {
        List<SeatAssignment> assignments = new ArrayList<>();

        // 按提交时间升序排序
        List<Application> sorted = new ArrayList<>(applications);
        sorted.sort(Comparator.comparing(a -> 
                Optional.ofNullable(a.getSubmittedAt()).orElse(LocalDateTime.MIN)));

        for (Application app : sorted) {
            // 找到第一个有剩余容量的考场
            VenueId chosen = venues.stream()
                    .map(Venue::getId)
                    .filter(id -> remaining.getOrDefault(id, 0) > 0)
                    .findFirst()
                    .orElse(null);

            if (chosen == null) {
                break; // 没有剩余容量
            }

            int count = assignedCount.get(chosen) + 1;
            assignedCount.put(chosen, count);
            remaining.put(chosen, remaining.get(chosen) - 1);
            assignments.add(SeatAssignment.create(
                    app.getExamId(), app.getPositionId(), app.getId(), chosen, count, batchId));
        }

        return assignments;
    }

    /**
     * 策略4: 按岗位分组 + 随机
     */
    private List<SeatAssignment> allocatePositionFirstRandom(
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            Map<VenueId, Integer> remaining,
            Map<VenueId, Integer> assignedCount
    ) {
        List<SeatAssignment> assignments = new ArrayList<>();

        // 按岗位分组
        Map<PositionId, List<Application>> byPosition = applications.stream()
                .collect(Collectors.groupingBy(Application::getPositionId));

        // 按组大小降序排序
        List<Map.Entry<PositionId, List<Application>>> groups = new ArrayList<>(byPosition.entrySet());
        groups.sort((e1, e2) -> Integer.compare(e2.getValue().size(), e1.getValue().size()));

        Random random = new Random();
        for (var entry : groups) {
            // 组内随机打乱
            List<Application> apps = new ArrayList<>(entry.getValue());
            Collections.shuffle(apps, random);

            // 尽量将同一岗位的考生安排在同一考场
            VenueId preferred = null;
            for (Application app : apps) {
                VenueId chosen = preferred;
                if (chosen == null || remaining.getOrDefault(chosen, 0) <= 0) {
                    chosen = venues.stream()
                            .map(Venue::getId)
                            .filter(id -> remaining.getOrDefault(id, 0) > 0)
                            .findFirst()
                            .orElse(null);
                }
                if (chosen == null) {
                    break;
                }
                if (preferred == null) preferred = chosen;

                int count = assignedCount.get(chosen) + 1;
                assignedCount.put(chosen, count);
                remaining.put(chosen, remaining.get(chosen) - 1);
                assignments.add(SeatAssignment.create(
                        app.getExamId(), app.getPositionId(), app.getId(), chosen, count, batchId));
            }
        }

        return assignments;
    }

    /**
     * 策略5: 按自定义分组字段
     */
    private List<SeatAssignment> allocateByCustomGroup(
            List<Application> applications,
            List<Venue> venues,
            UUID batchId,
            Map<VenueId, Integer> remaining,
            Map<VenueId, Integer> assignedCount,
            String customGroupField
    ) {
        List<SeatAssignment> assignments = new ArrayList<>();

        if (customGroupField == null || customGroupField.isEmpty()) {
            // 如果没有指定分组字段，回退到默认策略
            return allocatePositionFirstSubmittedAt(applications, venues, batchId, remaining, assignedCount);
        }

        // 按自定义字段分组
        Map<String, List<Application>> byCustomField = applications.stream()
                .collect(Collectors.groupingBy(app -> {
                    String value = extractFieldFromPayload(app.getPayload(), customGroupField);
                    return value != null ? value : "未分组";
                }));

        // 按组大小降序排序
        List<Map.Entry<String, List<Application>>> groups = new ArrayList<>(byCustomField.entrySet());
        groups.sort((e1, e2) -> Integer.compare(e2.getValue().size(), e1.getValue().size()));

        for (var entry : groups) {
            // 组内按提交时间升序排序
            List<Application> apps = new ArrayList<>(entry.getValue());
            apps.sort(Comparator.comparing(a -> 
                    Optional.ofNullable(a.getSubmittedAt()).orElse(LocalDateTime.MIN)));

            // 尽量将同一分组的考生安排在同一考场
            VenueId preferred = null;
            for (Application app : apps) {
                VenueId chosen = preferred;
                if (chosen == null || remaining.getOrDefault(chosen, 0) <= 0) {
                    chosen = venues.stream()
                            .map(Venue::getId)
                            .filter(id -> remaining.getOrDefault(id, 0) > 0)
                            .findFirst()
                            .orElse(null);
                }
                if (chosen == null) {
                    break;
                }
                if (preferred == null) preferred = chosen;

                int count = assignedCount.get(chosen) + 1;
                assignedCount.put(chosen, count);
                remaining.put(chosen, remaining.get(chosen) - 1);
                assignments.add(SeatAssignment.create(
                        app.getExamId(), app.getPositionId(), app.getId(), chosen, count, batchId));
            }
        }

        return assignments;
    }

    /**
     * 从 JSON payload 中提取指定字段的值
     */
    private String extractFieldFromPayload(String payload, String fieldName) {
        if (payload == null || payload.isEmpty() || fieldName == null || fieldName.isEmpty()) {
            return null;
        }

        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            Object value = data.get(fieldName);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            // 解析失败，返回 null
            return null;
        }
    }
}

