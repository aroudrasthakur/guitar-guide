'use client'

import { useEffect, useRef } from 'react'
import type { ChordTemplate, ChordMatchResult, FingerAssignment } from '@/lib/types'
import { getChordTemplate } from '@/packages/shared/chord-templates'

interface ChordOverlayProps {
  chordName: string | null
  matchResult: ChordMatchResult | null
  fingerAssignments: FingerAssignment[]
  videoWidth: number
  videoHeight: number
  className?: string
}

export default function ChordOverlay({
  chordName,
  matchResult,
  fingerAssignments,
  videoWidth,
  videoHeight,
  className = '',
}: ChordOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !chordName) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = videoWidth
    canvas.height = videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const template = getChordTemplate(chordName)
    if (!template) return

    // Draw target finger positions
    const fingerNames = ['T', '1', '2', '3', '4'] // Thumb, Index, Middle, Ring, Pinky

    for (let stringIdx = 1; stringIdx <= 6; stringIdx++) {
      const constraint = template.strings[stringIdx]
      if (!constraint || constraint.type !== 'fretted') continue

      // Find corresponding finger assignment
      const assignment = fingerAssignments.find(
        (f) =>
          f.stringIdx === stringIdx &&
          Math.abs(f.fretIdx - constraint.fret) <= 0.5
      )

      const stringResult = matchResult?.perString[stringIdx]
      const isCorrect = stringResult?.ok === true

      // Determine color based on state
      let color = 'rgba(59, 130, 246, 0.6)' // Blue for target
      if (isCorrect) {
        color = 'rgba(34, 197, 94, 0.8)' // Green for correct
      } else if (assignment && !isCorrect) {
        color = 'rgba(239, 68, 68, 0.8)' // Red for incorrect
      }

      // Draw circle at target position
      // For MVP, use simplified positioning - in production would use actual fretboard coordinates
      const stringSpacing = videoWidth / 7
      const fretSpacing = videoHeight * 0.15
      const x = stringSpacing * (7 - stringIdx) // Reverse order (6=low E on left)
      const y = videoHeight * 0.2 + constraint.fret * fretSpacing

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.fill()

      // Draw finger number
      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(fingerNames[constraint.finger] || '?', x, y)
    }

    // Draw chord name in corner
    if (chordName) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 120, 40)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(template.name, 20, 20)
    }
  }, [chordName, matchResult, fingerAssignments, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
