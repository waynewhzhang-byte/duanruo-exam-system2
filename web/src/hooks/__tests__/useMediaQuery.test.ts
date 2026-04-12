import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useOrientation,
} from '../useMediaQuery'

describe('useMediaQuery', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false initially when media query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('should return true when media query matches', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))
    expect(result.current).toBe(true)
  })
})

describe('useIsMobile', () => {
  it('should return false for desktop screens', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('should return true for mobile screens', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('768px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})

describe('useIsTablet', () => {
  it('should use tablet breakpoint', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('768px') && query.includes('1024px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(true)
  })
})

describe('useIsDesktop', () => {
  it('should use desktop breakpoint', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })
})

describe('useIsTouchDevice', () => {
  it('should return true when touch is supported', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useIsTouchDevice())
    expect(result.current).toBe(true)

    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })
})

describe('useOrientation', () => {
  it('should return portrait by default', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true })

    const { result } = renderHook(() => useOrientation())
    expect(result.current).toBe('portrait')
  })

  it('should return landscape when width > height', () => {
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true })
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })

    const { result } = renderHook(() => useOrientation())
    expect(result.current).toBe('landscape')
  })
})
