'use client'

import { useState, useEffect } from 'react'

/**
 * 媒体查询Hook
 * 用于检测屏幕尺寸和设备类型
 * 
 * @param query - 媒体查询字符串
 * @returns 是否匹配媒体查询
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // 初始化状态
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // 监听变化
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // 添加监听器
    media.addEventListener('change', listener)

    // 清理
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

/**
 * 移动端检测Hook
 * 
 * @returns 是否为移动端设备
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}

/**
 * 平板检测Hook
 * 
 * @returns 是否为平板设备
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
}

/**
 * 桌面端检测Hook
 * 
 * @returns 是否为桌面端设备
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * 触摸设备检测Hook
 * 
 * @returns 是否为触摸设备
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

/**
 * 屏幕方向检测Hook
 * 
 * @returns 屏幕方向 ('portrait' | 'landscape')
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      )
    }

    // 初始化
    updateOrientation()

    // 监听变化
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    // 清理
    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

