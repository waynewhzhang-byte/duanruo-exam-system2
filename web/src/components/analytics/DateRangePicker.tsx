/**
 * Date range picker component for analytics filtering
 */

'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clsx } from 'clsx'
import { DateRange, dateRanges, getDateRangeLabel } from '@/lib/analytics-hooks'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange, customStart?: string, customEnd?: string) => void
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const handleRangeSelect = (range: DateRange) => {
    if (range === 'custom') {
      setShowCustom(true)
      return
    }
    
    onChange(range)
    setIsOpen(false)
    setShowCustom(false)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange('custom', customStart, customEnd)
      setIsOpen(false)
      setShowCustom(false)
    }
  }

  const handleCustomCancel = () => {
    setShowCustom(false)
    setCustomStart('')
    setCustomEnd('')
  }

  return (
    <div className={clsx('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2"
      >
        <Calendar className="h-4 w-4" />
        <span>{getDateRangeLabel(value)}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false)
              setShowCustom(false)
            }}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {!showCustom ? (
              <div className="p-2">
                <div className="space-y-1">
                  {Object.entries(dateRanges).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleRangeSelect(key as DateRange)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        value === key
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">自定义日期范围</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomCancel}
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                  >
                    应用
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Quick date range buttons
interface QuickDateRangeProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function QuickDateRange({ value, onChange, className }: QuickDateRangeProps) {
  const quickRanges: DateRange[] = ['7d', '30d', '90d']

  return (
    <div className={clsx('flex space-x-2', className)}>
      {quickRanges.map((range) => (
        <Button
          key={range}
          variant={value === range ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(range)}
        >
          {getDateRangeLabel(range)}
        </Button>
      ))}
    </div>
  )
}

// Date range display component
interface DateRangeDisplayProps {
  range: DateRange
  customStart?: string
  customEnd?: string
  className?: string
}

export function DateRangeDisplay({ 
  range, 
  customStart, 
  customEnd, 
  className 
}: DateRangeDisplayProps) {
  const getDisplayText = () => {
    if (range === 'custom' && customStart && customEnd) {
      const start = new Date(customStart).toLocaleDateString('zh-CN')
      const end = new Date(customEnd).toLocaleDateString('zh-CN')
      return `${start} - ${end}`
    }
    return getDateRangeLabel(range)
  }

  return (
    <div className={clsx('flex items-center text-sm text-gray-600', className)}>
      <Calendar className="h-4 w-4 mr-1" />
      <span>{getDisplayText()}</span>
    </div>
  )
}

// Utility function to get actual date range
export function getActualDateRange(range: DateRange, customStart?: string, customEnd?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (range === 'custom' && customStart && customEnd) {
    return {
      start: new Date(customStart),
      end: new Date(customEnd)
    }
  }

  switch (range) {
    case '7d':
      return {
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: today
      }
    case '30d':
      return {
        start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: today
      }
    case '90d':
      return {
        start: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000),
        end: today
      }
    case '1y':
      return {
        start: new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000),
        end: today
      }
    default:
      return {
        start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: today
      }
  }
}
