'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileFormFieldProps {
  /**
   * 字段标签
   */
  label: string
  
  /**
   * 是否必填
   */
  required?: boolean
  
  /**
   * 错误信息
   */
  error?: string
  
  /**
   * 帮助文本
   */
  helpText?: string
  
  /**
   * 字段内容
   */
  children: ReactNode
  
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * 移动端优化的表单字段组件
 * 提供更大的触摸区域和清晰的视觉反馈
 */
export default function MobileFormField({
  label,
  required = false,
  error,
  helpText,
  children,
  className
}: MobileFormFieldProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* 标签 */}
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* 字段内容 */}
      <div className={cn(
        error && 'ring-2 ring-red-500 rounded-md'
      )}>
        {children}
      </div>
      
      {/* 帮助文本 */}
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {/* 错误信息 */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 移动端优化的输入框组件
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * 左侧图标
   */
  leftIcon?: ReactNode
  
  /**
   * 右侧图标
   */
  rightIcon?: ReactNode
}

export function MobileInput({
  leftIcon,
  rightIcon,
  className,
  ...props
}: MobileInputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}
      
      <input
        className={cn(
          'w-full px-4 py-3 text-base',
          'bg-white border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'placeholder:text-gray-400',
          'transition-all duration-200',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        {...props}
      />
      
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightIcon}
        </div>
      )}
    </div>
  )
}

/**
 * 移动端优化的文本域组件
 */
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function MobileTextarea({
  className,
  ...props
}: MobileTextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 text-base',
        'bg-white border border-gray-300 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'placeholder:text-gray-400',
        'transition-all duration-200',
        'resize-none',
        className
      )}
      rows={4}
      {...props}
    />
  )
}

/**
 * 移动端优化的选择框组件
 */
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
}

export function MobileSelect({
  options,
  className,
  ...props
}: MobileSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full px-4 py-3 text-base appearance-none',
          'bg-white border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-all duration-200',
          'pr-10',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 下拉箭头 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

/**
 * 移动端优化的复选框组件
 */
interface MobileCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function MobileCheckbox({
  label,
  className,
  ...props
}: MobileCheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer py-2">
      <input
        type="checkbox"
        className={cn(
          'h-5 w-5 rounded border-gray-300',
          'text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-all duration-200',
          className
        )}
        {...props}
      />
      <span className="ml-3 text-base text-gray-900">
        {label}
      </span>
    </label>
  )
}

