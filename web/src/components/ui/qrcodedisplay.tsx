'use client'

import { useEffect, useRef } from 'react'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ value, size = 96, className = '' }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Simple QR code placeholder - in a real app, you'd use a QR code library like qrcode
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Draw a simple pattern to represent QR code
    ctx.fillStyle = '#000000'
    const cellSize = size / 21 // Standard QR code is 21x21 modules for version 1
    
    // Draw corner markers
    const drawCornerMarker = (x: number, y: number) => {
      // Outer square
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize)
      ctx.fillStyle = '#000000'
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize)
    }

    // Draw three corner markers
    drawCornerMarker(0, 0)   // Top-left
    drawCornerMarker(14, 0)  // Top-right
    drawCornerMarker(0, 14)  // Bottom-left

    // Draw some random pattern for data
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        // Skip corner markers
        if ((i < 9 && j < 9) || (i < 9 && j > 12) || (i > 12 && j < 9)) continue
        
        // Create a pseudo-random pattern based on the value
        const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        if ((i + j + hash) % 3 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        }
      }
    }
  }, [value, size])

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded"
        style={{ width: size, height: size }}
      />
    </div>
  )
}

// Alternative component using CSS for a simple pattern
export function SimpleQRCode({ value, size = 96, className = '' }: QRCodeDisplayProps) {
  // Create a simple grid pattern based on the value
  const gridSize = 21
  const cells = []
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const isBlack = (i + j + hash) % 3 === 0
      
      // Corner markers
      const isCornerMarker = 
        (i < 7 && j < 7) || 
        (i < 7 && j > 13) || 
        (i > 13 && j < 7)
      
      if (isCornerMarker) {
        const isOuterBorder = i === 0 || i === 6 || j === 0 || j === 6 ||
                             (i >= 14 && i <= 20 && (j === 0 || j === 6)) ||
                             (j >= 14 && j <= 20 && (i === 0 || i === 6))
        const isInnerSquare = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
                             (i >= 2 && i <= 4 && j >= 16 && j <= 18) ||
                             (i >= 16 && i <= 18 && j >= 2 && j <= 4)
        
        cells.push(
          <div
            key={`${i}-${j}`}
            className={`${isOuterBorder || isInnerSquare ? 'bg-black' : 'bg-white'}`}
            style={{
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
            }}
          />
        )
      } else {
        cells.push(
          <div
            key={`${i}-${j}`}
            className={`${isBlack ? 'bg-black' : 'bg-white'}`}
            style={{
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
            }}
          />
        )
      }
    }
  }

  return (
    <div 
      className={`inline-block border border-gray-200 rounded ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="grid grid-cols-21 w-full h-full"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
      >
        {cells}
      </div>
    </div>
  )
}
