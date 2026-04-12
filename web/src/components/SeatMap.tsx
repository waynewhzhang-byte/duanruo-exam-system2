'use client';

import React from 'react';

/**
 * 座位状态枚举
 */
export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  AISLE = 'AISLE',
  OCCUPIED = 'OCCUPIED',
}

/**
 * 座位数据接口
 */
export interface Seat {
  row: number;
  col: number;
  status: SeatStatus;
  label?: string;
  candidateName?: string;
  positionTitle?: string;
}

/**
 * 座位地图数据接口
 */
export interface SeatMapData {
  rows: number;
  columns: number;
  seats: Seat[];
}

/**
 * 座位地图组件属性
 */
interface SeatMapProps {
  data: SeatMapData;
  onSeatClick?: (seat: Seat) => void;
  editable?: boolean;
}

/**
 * 获取座位状态对应的样式类
 */
function getSeatStatusClass(status: SeatStatus): string {
  switch (status) {
    case SeatStatus.AVAILABLE:
      return 'bg-green-100 border-green-300 hover:bg-green-200';
    case SeatStatus.UNAVAILABLE:
      return 'bg-gray-300 border-gray-400 cursor-not-allowed';
    case SeatStatus.AISLE:
      return 'bg-white border-transparent cursor-default';
    case SeatStatus.OCCUPIED:
      return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
    default:
      return 'bg-gray-100 border-gray-300';
  }
}

/**
 * 获取座位状态对应的文本颜色
 */
function getSeatTextClass(status: SeatStatus): string {
  switch (status) {
    case SeatStatus.AVAILABLE:
      return 'text-green-700';
    case SeatStatus.UNAVAILABLE:
      return 'text-gray-500';
    case SeatStatus.AISLE:
      return 'text-transparent';
    case SeatStatus.OCCUPIED:
      return 'text-blue-700';
    default:
      return 'text-gray-700';
  }
}

/**
 * 座位地图可视化组件
 */
export default function SeatMap({ data, onSeatClick, editable = false }: SeatMapProps) {
  // 创建二维数组来表示座位布局
  const seatGrid: (Seat | null)[][] = Array.from({ length: data.rows }, () =>
    Array.from({ length: data.columns }, () => null)
  );

  // 填充座位数据
  data.seats.forEach((seat) => {
    if (seat.row >= 0 && seat.row < data.rows && seat.col >= 0 && seat.col < data.columns) {
      seatGrid[seat.row][seat.col] = seat;
    }
  });

  const handleSeatClick = (seat: Seat | null) => {
    if (!seat || seat.status === SeatStatus.AISLE) return;
    if (!editable && seat.status === SeatStatus.UNAVAILABLE) return;
    if (onSeatClick) {
      onSeatClick(seat);
    }
  };

  return (
    <div className="seat-map-container p-4">
      {/* 图例 */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="text-sm">可用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span className="text-sm">已占用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded"></div>
          <span className="text-sm">不可用</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border-2 border-transparent rounded"></div>
          <span className="text-sm">过道</span>
        </div>
      </div>

      {/* 座位地图 */}
      <div className="seat-grid overflow-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="inline-block">
          {seatGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 mb-1">
              {/* 行号 */}
              <div className="w-8 h-10 flex items-center justify-center text-xs text-gray-500 font-medium">
                {rowIndex + 1}
              </div>

              {/* 座位 */}
              {row.map((seat, colIndex) => {
                if (!seat) {
                  return (
                    <div
                      key={colIndex}
                      className="w-10 h-10 border border-dashed border-gray-300 rounded"
                    ></div>
                  );
                }

                const statusClass = getSeatStatusClass(seat.status);
                const textClass = getSeatTextClass(seat.status);
                const isClickable =
                  seat.status !== SeatStatus.AISLE &&
                  (editable || seat.status !== SeatStatus.UNAVAILABLE);

                return (
                  <div
                    key={colIndex}
                    className={`
                      w-10 h-10 border-2 rounded flex items-center justify-center
                      text-xs font-medium transition-colors
                      ${statusClass} ${textClass}
                      ${isClickable ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => handleSeatClick(seat)}
                    {...(isClickable && {
                      role: 'button' as const,
                      tabIndex: 0,
                      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSeatClick(seat); } },
                      'aria-label': seat.candidateName ? `座位 ${seat.candidateName}` : (seat.label || `座位 ${rowIndex + 1}-${colIndex + 1}`)
                    })}
                    title={
                      seat.candidateName
                        ? `${seat.candidateName} - ${seat.positionTitle || ''}`
                        : seat.label || `${rowIndex + 1}-${colIndex + 1}`
                    }
                  >
                    {seat.status === SeatStatus.AISLE ? (
                      ''
                    ) : seat.label ? (
                      seat.label
                    ) : (
                      `${colIndex + 1}`
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* 列号 */}
          <div className="flex gap-1 mt-1">
            <div className="w-8"></div>
            {Array.from({ length: data.columns }, (_, i) => (
              <div
                key={i}
                className="w-10 h-6 flex items-center justify-center text-xs text-gray-500 font-medium"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex gap-4">
          <span>
            总座位数: <strong>{data.seats.filter((s) => s.status !== SeatStatus.AISLE).length}</strong>
          </span>
          <span>
            可用座位: <strong>{data.seats.filter((s) => s.status === SeatStatus.AVAILABLE).length}</strong>
          </span>
          <span>
            已占用: <strong>{data.seats.filter((s) => s.status === SeatStatus.OCCUPIED).length}</strong>
          </span>
          <span>
            不可用: <strong>{data.seats.filter((s) => s.status === SeatStatus.UNAVAILABLE).length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

