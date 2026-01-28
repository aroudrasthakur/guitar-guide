'use client'

import { useEffect, useRef } from 'react'
import type { FretboardState } from '@/lib/types'

interface OverlayCanvasProps {
  fretboard: FretboardState
  videoWidth: number
  videoHeight: number
  className?: string
}

export default function OverlayCanvas({
  fretboard,
  videoWidth,
  videoHeight,
  className = '',
}: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = videoWidth
    canvas.height = videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw fretboard overlay
    if (fretboard.strings.length > 0 && fretboard.frets.length > 0) {
      // Draw string lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      fretboard.strings.forEach((string) => {
        if (string && string.start && string.end) {
          ctx.beginPath()
          ctx.moveTo(string.start.x, string.start.y)
          ctx.lineTo(string.end.x, string.end.y)
          ctx.stroke()
        }
      })

      // Draw fret lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      fretboard.frets.forEach((fret) => {
        if (fret && fret.start && fret.end) {
          ctx.beginPath()
          ctx.moveTo(fret.start.x, fret.start.y)
          ctx.lineTo(fret.end.x, fret.end.y)
          ctx.stroke()
        }
      })
    }
  }, [fretboard, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
