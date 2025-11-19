package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.SeatMapDTO;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.venue.SeatMap;
import com.duanruo.exam.domain.venue.Venue;
import com.duanruo.exam.domain.venue.VenueId;
import com.duanruo.exam.domain.venue.VenueRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VenueApplicationService {
    private final VenueRepository venueRepository;
    private final ExamRepository examRepository;
    private final ObjectMapper objectMapper;

    public VenueApplicationService(VenueRepository venueRepository,
                                   ExamRepository examRepository,
                                   ObjectMapper objectMapper) {
        this.venueRepository = venueRepository;
        this.examRepository = examRepository;
        this.objectMapper = objectMapper;
    }

    public Venue create(UUID examId, String name, Integer capacity) {
        var exam = examRepository.findById(ExamId.of(examId)).orElseThrow(() -> new IllegalArgumentException("exam not found"));
        var v = Venue.create(exam.getId(), name, capacity);
        venueRepository.save(v);
        return v;
    }

    @Transactional(readOnly = true)
    public List<Venue> listByExam(UUID examId) {
        return venueRepository.findByExamId(ExamId.of(examId));
    }

    public void update(UUID venueId, String name, Integer capacity, String seatMapJson) {
        var v = venueRepository.findById(VenueId.of(venueId)).orElseThrow(() -> new IllegalArgumentException("venue not found"));
        v.update(name, capacity, seatMapJson);
        venueRepository.save(v);
    }

    public void delete(UUID venueId) {
        venueRepository.delete(VenueId.of(venueId));
    }

    /**
     * 创建座位地图
     */
    public SeatMapDTO createSeatMap(UUID venueId, int rows, int columns) {
        Venue venue = venueRepository.findById(VenueId.of(venueId))
                .orElseThrow(() -> new IllegalArgumentException("venue not found"));

        SeatMap seatMap = SeatMap.create(rows, columns);
        String seatMapJson = toJson(seatMap);

        venue.update(null, null, seatMapJson);
        venueRepository.save(venue);

        return toSeatMapDTO(seatMap);
    }

    /**
     * 获取座位地图
     */
    @Transactional(readOnly = true)
    public SeatMapDTO getSeatMap(UUID venueId) {
        Venue venue = venueRepository.findById(VenueId.of(venueId))
                .orElseThrow(() -> new IllegalArgumentException("venue not found"));

        if (venue.getSeatMapJson() == null || venue.getSeatMapJson().isEmpty()) {
            return null;
        }

        SeatMap seatMap = fromJson(venue.getSeatMapJson());
        return toSeatMapDTO(seatMap);
    }

    /**
     * 更新座位状态
     */
    public void updateSeatStatus(UUID venueId, int row, int col, String status) {
        Venue venue = venueRepository.findById(VenueId.of(venueId))
                .orElseThrow(() -> new IllegalArgumentException("venue not found"));

        if (venue.getSeatMapJson() == null || venue.getSeatMapJson().isEmpty()) {
            throw new IllegalStateException("seat map not found");
        }

        SeatMap seatMap = fromJson(venue.getSeatMapJson());
        seatMap.setSeatStatus(row, col, SeatMap.SeatStatus.valueOf(status));

        String seatMapJson = toJson(seatMap);
        venue.update(null, null, seatMapJson);
        venueRepository.save(venue);
    }

    /**
     * 更新座位标签
     */
    public void updateSeatLabel(UUID venueId, int row, int col, String label) {
        Venue venue = venueRepository.findById(VenueId.of(venueId))
                .orElseThrow(() -> new IllegalArgumentException("venue not found"));

        if (venue.getSeatMapJson() == null || venue.getSeatMapJson().isEmpty()) {
            throw new IllegalStateException("seat map not found");
        }

        SeatMap seatMap = fromJson(venue.getSeatMapJson());
        seatMap.setSeatLabel(row, col, label);

        String seatMapJson = toJson(seatMap);
        venue.update(null, null, seatMapJson);
        venueRepository.save(venue);
    }

    // Helper methods

    private String toJson(SeatMap seatMap) {
        try {
            return objectMapper.writeValueAsString(seatMap);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize seat map", e);
        }
    }

    private SeatMap fromJson(String json) {
        try {
            return objectMapper.readValue(json, SeatMap.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize seat map", e);
        }
    }

    private SeatMapDTO toSeatMapDTO(SeatMap seatMap) {
        List<SeatMapDTO.SeatDTO> seatDTOs = seatMap.getSeats().stream()
                .map(seat -> new SeatMapDTO.SeatDTO(
                        seat.getRow(),
                        seat.getCol(),
                        seat.getStatus().name(),
                        seat.getLabel()
                ))
                .collect(Collectors.toList());

        return new SeatMapDTO(seatMap.getRows(), seatMap.getColumns(), seatDTOs);
    }
}

