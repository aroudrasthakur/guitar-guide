'use client'

import { useState, useRef, useEffect } from 'react'
import type { Point2D, Line } from '@/lib/types'
import { computeHomography } from './homography'
import { useCalibrationStore } from './CalibrationStore'

interface ManualCalibrationProps {
  videoWidth: number
  videoHeight: number
  onComplete: () => void
}

type CalibrationStep = 'nut-left' | 'nut-right' | 'fret-left' | 'fret-right' | 'complete'

export default function ManualCalibration({
  videoWidth,
  videoHeight,
  onComplete,
}: ManualCalibrationProps) {
  const [step, setStep] = useState<CalibrationStep>('nut-left')
  const [points, setPoints] = useState<{
    nutLeft?: Point2D
    nutRight?: Point2D
    fretLeft?: Point2D
    fretRight?: Point2D
  }>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { setFretboard, saveCalibration, guitarType, handedness } = useCalibrationStore()

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * videoWidth
    const y = ((e.clientY - rect.top) / rect.height) * videoHeight

    const point: Point2D = { x, y }

    switch (step) {
      case 'nut-left':
        setPoints({ ...points, nutLeft: point })
        setStep('nut-right')
        break
      case 'nut-right':
        setPoints({ ...points, nutRight: point })
        setStep('fret-left')
        break
      case 'fret-left':
        setPoints({ ...points, fretLeft: point })
        setStep('fret-right')
        break
      case 'fret-right':
        setPoints({ ...points, fretRight: point })
        completeCalibration()
        break
    }
  }

  const completeCalibration = () => {
    if (
      !points.nutLeft ||
      !points.nutRight ||
      !points.fretLeft ||
      !points.fretRight
    ) {
      return
    }

    // Validate points
    const allPoints = [points.nutLeft, points.nutRight, points.fretLeft, points.fretRight]
    if (allPoints.some(p => !p || typeof p.x !== 'number' || typeof p.y !== 'number' || !isFinite(p.x) || !isFinite(p.y))) {
      console.error('Invalid calibration points')
      return
    }

    // Compute homography
    const sourcePoints: Point2D[] = [
      points.nutLeft,
      points.nutRight,
      points.fretLeft,
      points.fretRight,
    ]

    const targetPoints: Point2D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]

    const homography = computeHomography(sourcePoints, targetPoints)

    if (homography) {
      // Create string and fret lines
      const strings = []
      const frets = []

      // Project 6 string lines
      for (let i = 0; i < 6; i++) {
        const x = (points.nutLeft.x + (points.nutRight.x - points.nutLeft.x) * (i + 0.5)) / 6
        strings.push({
          start: { x, y: points.nutLeft.y },
          end: { x, y: points.fretLeft.y },
        })
      }

      // Create fret lines
      frets.push({
        start: points.nutLeft,
        end: points.nutRight,
      })

      const fretSpacing = points.fretLeft.y - points.nutLeft.y
      for (let i = 1; i <= 5; i++) {
        const y = points.nutLeft.y + fretSpacing * i
        frets.push({
          start: { x: points.nutLeft.x, y },
          end: { x: points.nutRight.x, y },
        })
      }

      const fretboard = {
        homography,
        strings,
        frets,
        confidence: 0.9,
      }

      setFretboard(fretboard)

      // Save calibration profile
      saveCalibration({
        homography,
        strings,
        frets,
        guitarType,
        handedness,
        timestamp: Date.now(),
      })

      setStep('complete')
      setTimeout(() => {
        onComplete()
      }, 1500)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = videoWidth
    canvas.height = videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw instruction overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const instructions = {
      'nut-left': 'Tap the left end of the nut',
      'nut-right': 'Tap the right end of the nut',
      'fret-left': 'Tap the left end of the 3rd fret',
      'fret-right': 'Tap the right end of the 3rd fret',
      complete: 'Calibration complete!',
    }

    ctx.fillText(instructions[step], canvas.width / 2, canvas.height / 2)

    // Draw collected points
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'
    const drawPoint = (point: Point2D | undefined) => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    drawPoint(points.nutLeft)
    drawPoint(points.nutRight)
    drawPoint(points.fretLeft)
    drawPoint(points.fretRight)

    // Draw lines connecting points
    const drawLine = (start: Point2D | undefined, end: Point2D | undefined) => {
      if (start && end && typeof start.x === 'number' && typeof start.y === 'number' &&
          typeof end.x === 'number' && typeof end.y === 'number') {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
      }
    }

    drawLine(points.nutLeft, points.nutRight)
    drawLine(points.fretLeft, points.fretRight)
  }, [step, points, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute top-0 left-0 cursor-crosshair"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
