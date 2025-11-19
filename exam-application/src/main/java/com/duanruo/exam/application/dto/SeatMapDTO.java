package com.duanruo.exam.application.dto;

import java.util.List;

/**
 * 座位地图DTO
 */
public class SeatMapDTO {
    private int rows;
    private int columns;
    private List<SeatDTO> seats;
    
    public SeatMapDTO() {}
    
    public SeatMapDTO(int rows, int columns, List<SeatDTO> seats) {
        this.rows = rows;
        this.columns = columns;
        this.seats = seats;
    }
    
    public int getRows() {
        return rows;
    }
    
    public void setRows(int rows) {
        this.rows = rows;
    }
    
    public int getColumns() {
        return columns;
    }
    
    public void setColumns(int columns) {
        this.columns = columns;
    }
    
    public List<SeatDTO> getSeats() {
        return seats;
    }
    
    public void setSeats(List<SeatDTO> seats) {
        this.seats = seats;
    }
    
    /**
     * 座位DTO
     */
    public static class SeatDTO {
        private int row;
        private int col;
        private String status;  // AVAILABLE, UNAVAILABLE, AISLE, OCCUPIED
        private String label;
        private String candidateName;  // 考生姓名（如果已分配）
        private String positionTitle;  // 岗位名称（如果已分配）
        
        public SeatDTO() {}
        
        public SeatDTO(int row, int col, String status, String label) {
            this.row = row;
            this.col = col;
            this.status = status;
            this.label = label;
        }
        
        public int getRow() {
            return row;
        }
        
        public void setRow(int row) {
            this.row = row;
        }
        
        public int getCol() {
            return col;
        }
        
        public void setCol(int col) {
            this.col = col;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getLabel() {
            return label;
        }
        
        public void setLabel(String label) {
            this.label = label;
        }
        
        public String getCandidateName() {
            return candidateName;
        }
        
        public void setCandidateName(String candidateName) {
            this.candidateName = candidateName;
        }
        
        public String getPositionTitle() {
            return positionTitle;
        }
        
        public void setPositionTitle(String positionTitle) {
            this.positionTitle = positionTitle;
        }
    }
}

