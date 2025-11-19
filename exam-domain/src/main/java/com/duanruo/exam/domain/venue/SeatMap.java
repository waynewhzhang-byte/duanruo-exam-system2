package com.duanruo.exam.domain.venue;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 座位地图值对象
 * 定义考场的座位布局
 */
public class SeatMap {
    private int rows;           // 行数
    private int columns;        // 列数
    private List<Seat> seats;   // 座位列表
    
    private SeatMap() {
        this.seats = new ArrayList<>();
    }
    
    /**
     * 创建座位地图
     * 
     * @param rows 行数
     * @param columns 列数
     * @return 座位地图
     */
    public static SeatMap create(int rows, int columns) {
        if (rows <= 0 || rows > 50) {
            throw new IllegalArgumentException("行数必须在1-50之间");
        }
        if (columns <= 0 || columns > 50) {
            throw new IllegalArgumentException("列数必须在1-50之间");
        }
        
        SeatMap map = new SeatMap();
        map.rows = rows;
        map.columns = columns;
        map.seats = new ArrayList<>();
        
        // 初始化所有座位为可用状态
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < columns; col++) {
                map.seats.add(new Seat(row, col, SeatStatus.AVAILABLE, null));
            }
        }
        
        return map;
    }
    
    /**
     * 重建座位地图（从持久化数据）
     */
    public static SeatMap rebuild(int rows, int columns, List<Seat> seats) {
        SeatMap map = new SeatMap();
        map.rows = rows;
        map.columns = columns;
        map.seats = seats != null ? new ArrayList<>(seats) : new ArrayList<>();
        return map;
    }
    
    /**
     * 设置座位状态
     */
    public void setSeatStatus(int row, int col, SeatStatus status) {
        Seat seat = findSeat(row, col);
        if (seat != null) {
            seats.remove(seat);
            seats.add(new Seat(row, col, status, seat.getLabel()));
        }
    }
    
    /**
     * 设置座位标签
     */
    public void setSeatLabel(int row, int col, String label) {
        Seat seat = findSeat(row, col);
        if (seat != null) {
            seats.remove(seat);
            seats.add(new Seat(row, col, seat.getStatus(), label));
        }
    }
    
    /**
     * 标记座位为不可用
     */
    public void markSeatUnavailable(int row, int col) {
        setSeatStatus(row, col, SeatStatus.UNAVAILABLE);
    }
    
    /**
     * 标记座位为过道
     */
    public void markSeatAsAisle(int row, int col) {
        setSeatStatus(row, col, SeatStatus.AISLE);
    }
    
    /**
     * 获取可用座位数量
     */
    public int getAvailableSeatsCount() {
        return (int) seats.stream()
                .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
                .count();
    }
    
    /**
     * 查找座位
     */
    private Seat findSeat(int row, int col) {
        return seats.stream()
                .filter(s -> s.getRow() == row && s.getCol() == col)
                .findFirst()
                .orElse(null);
    }
    
    public int getRows() {
        return rows;
    }
    
    public int getColumns() {
        return columns;
    }
    
    public List<Seat> getSeats() {
        return new ArrayList<>(seats);
    }
    
    /**
     * 座位值对象
     */
    public static class Seat {
        private final int row;
        private final int col;
        private final SeatStatus status;
        private final String label;  // 座位标签（如 "A1", "B2"）
        
        public Seat(int row, int col, SeatStatus status, String label) {
            this.row = row;
            this.col = col;
            this.status = status;
            this.label = label;
        }
        
        public int getRow() {
            return row;
        }
        
        public int getCol() {
            return col;
        }
        
        public SeatStatus getStatus() {
            return status;
        }
        
        public String getLabel() {
            return label;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Seat seat = (Seat) o;
            return row == seat.row && col == seat.col;
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(row, col);
        }
    }
    
    /**
     * 座位状态枚举
     */
    public enum SeatStatus {
        AVAILABLE,      // 可用
        UNAVAILABLE,    // 不可用（损坏、维修等）
        AISLE,          // 过道
        OCCUPIED        // 已占用（已分配）
    }
}

