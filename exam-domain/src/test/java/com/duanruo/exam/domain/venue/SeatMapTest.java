package com.duanruo.exam.domain.venue;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 座位地图单元测试
 */
class SeatMapTest {

    @Test
    void create_shouldCreateSeatMapWithAllAvailableSeats() {
        // Given
        int rows = 5;
        int columns = 10;

        // When
        SeatMap seatMap = SeatMap.create(rows, columns);

        // Then
        assertNotNull(seatMap);
        assertEquals(rows, seatMap.getRows());
        assertEquals(columns, seatMap.getColumns());
        assertEquals(rows * columns, seatMap.getSeats().size());
        assertEquals(rows * columns, seatMap.getAvailableSeatsCount());
    }

    @Test
    void create_shouldThrowException_whenRowsInvalid() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(0, 10));
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(-1, 10));
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(51, 10));
    }

    @Test
    void create_shouldThrowException_whenColumnsInvalid() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(10, 0));
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(10, -1));
        assertThrows(IllegalArgumentException.class, () -> SeatMap.create(10, 51));
    }

    @Test
    void setSeatStatus_shouldUpdateSeatStatus() {
        // Given
        SeatMap seatMap = SeatMap.create(5, 10);
        int row = 2;
        int col = 3;

        // When
        seatMap.setSeatStatus(row, col, SeatMap.SeatStatus.UNAVAILABLE);

        // Then
        SeatMap.Seat seat = seatMap.getSeats().stream()
                .filter(s -> s.getRow() == row && s.getCol() == col)
                .findFirst()
                .orElse(null);
        assertNotNull(seat);
        assertEquals(SeatMap.SeatStatus.UNAVAILABLE, seat.getStatus());
    }

    @Test
    void setSeatLabel_shouldUpdateSeatLabel() {
        // Given
        SeatMap seatMap = SeatMap.create(5, 10);
        int row = 1;
        int col = 2;
        String label = "A3";

        // When
        seatMap.setSeatLabel(row, col, label);

        // Then
        SeatMap.Seat seat = seatMap.getSeats().stream()
                .filter(s -> s.getRow() == row && s.getCol() == col)
                .findFirst()
                .orElse(null);
        assertNotNull(seat);
        assertEquals(label, seat.getLabel());
    }

    @Test
    void markSeatUnavailable_shouldSetStatusToUnavailable() {
        // Given
        SeatMap seatMap = SeatMap.create(5, 10);
        int row = 0;
        int col = 0;

        // When
        seatMap.markSeatUnavailable(row, col);

        // Then
        SeatMap.Seat seat = seatMap.getSeats().stream()
                .filter(s -> s.getRow() == row && s.getCol() == col)
                .findFirst()
                .orElse(null);
        assertNotNull(seat);
        assertEquals(SeatMap.SeatStatus.UNAVAILABLE, seat.getStatus());
    }

    @Test
    void markSeatAsAisle_shouldSetStatusToAisle() {
        // Given
        SeatMap seatMap = SeatMap.create(5, 10);
        int row = 2;
        int col = 5;

        // When
        seatMap.markSeatAsAisle(row, col);

        // Then
        SeatMap.Seat seat = seatMap.getSeats().stream()
                .filter(s -> s.getRow() == row && s.getCol() == col)
                .findFirst()
                .orElse(null);
        assertNotNull(seat);
        assertEquals(SeatMap.SeatStatus.AISLE, seat.getStatus());
    }

    @Test
    void getAvailableSeatsCount_shouldReturnCorrectCount() {
        // Given
        SeatMap seatMap = SeatMap.create(5, 10);
        
        // When
        seatMap.markSeatUnavailable(0, 0);
        seatMap.markSeatUnavailable(1, 1);
        seatMap.markSeatAsAisle(2, 2);
        seatMap.markSeatAsAisle(3, 3);

        // Then
        assertEquals(46, seatMap.getAvailableSeatsCount()); // 50 - 4 = 46
    }

    @Test
    void rebuild_shouldRestoreSeatMap() {
        // Given
        SeatMap original = SeatMap.create(3, 4);
        original.setSeatLabel(0, 0, "A1");
        original.markSeatUnavailable(1, 1);

        // When
        SeatMap rebuilt = SeatMap.rebuild(
                original.getRows(),
                original.getColumns(),
                original.getSeats()
        );

        // Then
        assertEquals(original.getRows(), rebuilt.getRows());
        assertEquals(original.getColumns(), rebuilt.getColumns());
        assertEquals(original.getSeats().size(), rebuilt.getSeats().size());
    }

    @Test
    void seat_shouldBeEqualBasedOnPosition() {
        // Given
        SeatMap.Seat seat1 = new SeatMap.Seat(1, 2, SeatMap.SeatStatus.AVAILABLE, "A1");
        SeatMap.Seat seat2 = new SeatMap.Seat(1, 2, SeatMap.SeatStatus.UNAVAILABLE, "B2");
        SeatMap.Seat seat3 = new SeatMap.Seat(2, 3, SeatMap.SeatStatus.AVAILABLE, "A1");

        // Then
        assertEquals(seat1, seat2); // Same position, different status/label
        assertNotEquals(seat1, seat3); // Different position
    }
}

