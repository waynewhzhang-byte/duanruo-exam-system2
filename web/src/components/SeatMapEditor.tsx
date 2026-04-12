'use client';

import React, { useState } from 'react';
import SeatMap, { Seat, SeatMapData, SeatStatus } from './SeatMap';
import { useTenant } from '@/hooks/useTenant';
import { apiPostWithTenant, apiPutWithTenant } from '@/lib/api';

/**
 * 座位地图编辑器组件属性
 */
interface SeatMapEditorProps {
  venueId: string;
  initialData?: SeatMapData;
  onSave?: (data: SeatMapData) => Promise<void>;
}

/**
 * 编辑模式枚举
 */
enum EditMode {
  NONE = 'NONE',
  SET_UNAVAILABLE = 'SET_UNAVAILABLE',
  SET_AVAILABLE = 'SET_AVAILABLE',
  SET_AISLE = 'SET_AISLE',
  SET_LABEL = 'SET_LABEL',
}

/**
 * 座位地图编辑器组件
 */
export default function SeatMapEditor({ venueId, initialData, onSave }: SeatMapEditorProps) {
  const { tenant } = useTenant();
  const [seatMapData, setSeatMapData] = useState<SeatMapData | null>(initialData || null);
  const [editMode, setEditMode] = useState<EditMode>(EditMode.NONE);
  const [rows, setRows] = useState<number>(10);
  const [columns, setColumns] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  // 创建新的座位地图
  const handleCreateSeatMap = async () => {
    if (!tenant?.id) {
      alert('租户信息缺失，无法创建座位地图');
      return;
    }
    try {
      const data = await apiPostWithTenant<SeatMapData>(
        `/seating/venues/${venueId}/seat-map?rows=${rows}&columns=${columns}`,
        tenant.id,
        {},
      );

      setSeatMapData(data);
    } catch (error) {
      console.error('Error creating seat map:', error);
      alert('创建座位地图失败');
    }
  };

  // 处理座位点击
  const handleSeatClick = async (seat: Seat) => {
    if (!seatMapData) return;

    let newStatus: SeatStatus = seat.status;

    switch (editMode) {
      case EditMode.SET_UNAVAILABLE:
        newStatus = SeatStatus.UNAVAILABLE;
        break;
      case EditMode.SET_AVAILABLE:
        newStatus = SeatStatus.AVAILABLE;
        break;
      case EditMode.SET_AISLE:
        newStatus = SeatStatus.AISLE;
        break;
      case EditMode.SET_LABEL: {
        const label = prompt('请输入座位标签:', seat.label || '');
        if (label !== null) {
          await updateSeatLabel(seat.row, seat.col, label);
        }
        return;
      }
      default:
        return;
    }

    if (newStatus !== seat.status) {
      await updateSeatStatus(seat.row, seat.col, newStatus);
    }
  };

  // 更新座位状态
  const updateSeatStatus = async (row: number, col: number, status: SeatStatus) => {
    if (!tenant?.id) return;
    try {
      await apiPutWithTenant<SeatMapData>(
        `/seating/venues/${venueId}/seat-map/seats/${row}/${col}/status?status=${status}`,
        tenant.id,
        {},
      );

      // 更新本地状态
      if (seatMapData) {
        const updatedSeats = seatMapData.seats.map((s) =>
          s.row === row && s.col === col ? { ...s, status } : s,
        );
        setSeatMapData({ ...seatMapData, seats: updatedSeats });
      }
    } catch (error) {
      console.error('Error updating seat status:', error);
      alert('更新座位状态失败');
    }
  };

  // 更新座位标签
  const updateSeatLabel = async (row: number, col: number, label: string) => {
    if (!tenant?.id) return;
    try {
      await apiPutWithTenant<SeatMapData>(
        `/seating/venues/${venueId}/seat-map/seats/${row}/${col}/label?label=${encodeURIComponent(label)}`,
        tenant.id,
        {},
      );

      // 更新本地状态
      if (seatMapData) {
        const updatedSeats = seatMapData.seats.map((s) =>
          s.row === row && s.col === col ? { ...s, label } : s,
        );
        setSeatMapData({ ...seatMapData, seats: updatedSeats });
      }
    } catch (error) {
      console.error('Error updating seat label:', error);
      alert('更新座位标签失败');
    }
  };

  // 保存座位地图
  const handleSave = async () => {
    if (!seatMapData || !onSave) return;

    setSaving(true);
    try {
      await onSave(seatMapData);
      alert('保存成功');
    } catch (error) {
      console.error('Error saving seat map:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="seat-map-editor">
      {!seatMapData ? (
        // 创建座位地图表单
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">创建座位地图</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">行数</label>
              <input
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">列数</label>
              <input
                type="number"
                min="1"
                max="50"
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleCreateSeatMap}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建座位地图
            </button>
          </div>
        </div>
      ) : (
        // 座位地图编辑器
        <div className="space-y-4">
          {/* 工具栏 */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">编辑工具</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setEditMode(EditMode.SET_AVAILABLE)}
                className={`px-4 py-2 rounded-md ${
                  editMode === EditMode.SET_AVAILABLE
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                设为可用
              </button>
              <button
                onClick={() => setEditMode(EditMode.SET_UNAVAILABLE)}
                className={`px-4 py-2 rounded-md ${
                  editMode === EditMode.SET_UNAVAILABLE
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                设为不可用
              </button>
              <button
                onClick={() => setEditMode(EditMode.SET_AISLE)}
                className={`px-4 py-2 rounded-md ${
                  editMode === EditMode.SET_AISLE
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                设为过道
              </button>
              <button
                onClick={() => setEditMode(EditMode.SET_LABEL)}
                className={`px-4 py-2 rounded-md ${
                  editMode === EditMode.SET_LABEL
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                设置标签
              </button>
              <button
                onClick={() => setEditMode(EditMode.NONE)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消选择
              </button>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {editMode === EditMode.NONE && '请选择一个编辑工具'}
              {editMode === EditMode.SET_AVAILABLE && '点击座位设为可用'}
              {editMode === EditMode.SET_UNAVAILABLE && '点击座位设为不可用'}
              {editMode === EditMode.SET_AISLE && '点击座位设为过道'}
              {editMode === EditMode.SET_LABEL && '点击座位设置标签'}
            </div>
          </div>

          {/* 座位地图 */}
          <div className="bg-white rounded-lg shadow">
            <SeatMap data={seatMapData} onSeatClick={handleSeatClick} editable={true} />
          </div>

          {/* 保存按钮 */}
          {onSave && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? '保存中...' : '保存座位地图'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
