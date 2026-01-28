// Hough line transform for fretboard detection

import type { Point2D, Line } from '@/lib/types'

export interface LineDetectionResult {
  lines: Line[]
  dominantAngle: number
  confidence: number
}

/**
 * Detect lines using Hough transform (simplified for MVP)
 * In production, use OpenCV.js or similar library
 */
export function detectLines(
  imageData: ImageData | null,
  minLineLength: number = 30,
  maxLineGap: number = 10
): LineDetectionResult {
  if (!imageData || !imageData.data || imageData.width === 0 || imageData.height === 0) {
    return {
      lines: [],
      dominantAngle: 0,
      confidence: 0,
    }
  }

  const { width, height, data } = imageData
  const lines: Line[] = []

  // Simplified edge detection (Canny-like)
  const edges = detectEdges(imageData)

  // Simplified Hough transform
  // For MVP, we'll use a basic approach
  // In production, use a proper Hough line transform

  // Detect horizontal lines (frets)
  const horizontalLines = detectHorizontalLines(edges, width, height)
  lines.push(...horizontalLines)

  // Detect vertical lines (strings)
  const verticalLines = detectVerticalLines(edges, width, height)
  lines.push(...verticalLines)

  // Estimate dominant angle (neck axis)
  const dominantAngle = estimateDominantAngle(lines)

  // Calculate confidence based on line count and regularity
  const confidence = calculateConfidence(lines, width, height)

  return {
    lines,
    dominantAngle,
    confidence,
  }
}

/**
 * Simple edge detection (Sobel-like)
 */
function detectEdges(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData
  const edges = new Uint8Array(width * height)

  // Convert to grayscale and apply Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const r = data[idx * 4]
      const g = data[idx * 4 + 1]
      const b = data[idx * 4 + 2]
      const gray = (r + g + b) / 3

      // Sobel X
      const gx =
        -1 * getGray(data, x - 1, y - 1, width) +
        1 * getGray(data, x + 1, y - 1, width) +
        -2 * getGray(data, x - 1, y, width) +
        2 * getGray(data, x + 1, y, width) +
        -1 * getGray(data, x - 1, y + 1, width) +
        1 * getGray(data, x + 1, y + 1, width)

      // Sobel Y
      const gy =
        -1 * getGray(data, x - 1, y - 1, width) +
        -2 * getGray(data, x, y - 1, width) +
        -1 * getGray(data, x + 1, y - 1, width) +
        1 * getGray(data, x - 1, y + 1, width) +
        2 * getGray(data, x, y + 1, width) +
        1 * getGray(data, x + 1, y + 1, width)

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges[idx] = magnitude > 50 ? 255 : 0 // Threshold
    }
  }

  return edges
}

function getGray(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): number {
  const idx = y * width + x
  if (idx * 4 + 2 >= data.length || idx < 0) {
    return 0
  }
  const r = data[idx * 4] ?? 0
  const g = data[idx * 4 + 1] ?? 0
  const b = data[idx * 4 + 2] ?? 0
  return (r + g + b) / 3
}

/**
 * Detect horizontal lines (frets)
 */
function detectHorizontalLines(
  edges: Uint8Array,
  width: number,
  height: number
): Line[] {
  const lines: Line[] = []
  const threshold = width * 0.3 // Minimum line length

  for (let y = 0; y < height; y++) {
    let lineStart = -1
    let lineLength = 0

    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (edges[idx] > 128) {
        if (lineStart === -1) {
          lineStart = x
        }
        lineLength++
      } else {
        if (lineLength > threshold) {
          lines.push({
            start: { x: lineStart, y },
            end: { x: lineStart + lineLength, y },
          })
        }
        lineStart = -1
        lineLength = 0
      }
    }

    if (lineLength > threshold) {
      lines.push({
        start: { x: lineStart, y },
        end: { x: lineStart + lineLength, y },
      })
    }
  }

  return lines
}

/**
 * Detect vertical lines (strings)
 */
function detectVerticalLines(
  edges: Uint8Array,
  width: number,
  height: number
): Line[] {
  const lines: Line[] = []
  const threshold = height * 0.3 // Minimum line length

  for (let x = 0; x < width; x++) {
    let lineStart = -1
    let lineLength = 0

    for (let y = 0; y < height; y++) {
      const idx = y * width + x
      if (edges[idx] > 128) {
        if (lineStart === -1) {
          lineStart = y
        }
        lineLength++
      } else {
        if (lineLength > threshold) {
          lines.push({
            start: { x, y: lineStart },
            end: { x, y: lineStart + lineLength },
          })
        }
        lineStart = -1
        lineLength = 0
      }
    }

    if (lineLength > threshold) {
      lines.push({
        start: { x, y: lineStart },
        end: { x, y: lineStart + lineLength },
      })
    }
  }

  return lines
}

/**
 * Estimate dominant angle from detected lines
 */
function estimateDominantAngle(lines: Line[]): number {
  if (lines.length === 0) {
    return 0
  }

  // Calculate angles for each line
  const angles = lines.map((line) => {
    const dx = line.end.x - line.start.x
    const dy = line.end.y - line.start.y
    return Math.atan2(dy, dx)
  })

  // Find most common angle (simplified - use histogram in production)
  const angleCounts = new Map<number, number>()
  for (const angle of angles) {
    const rounded = Math.round(angle * 10) / 10
    angleCounts.set(rounded, (angleCounts.get(rounded) || 0) + 1)
  }

  let maxCount = 0
  let dominantAngle = 0
  for (const [angle, count] of angleCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      dominantAngle = angle
    }
  }

  return dominantAngle
}

/**
 * Calculate confidence score based on detected lines
 */
function calculateConfidence(
  lines: Line[],
  width: number,
  height: number
): number {
  if (lines.length < 4) {
    return 0
  }

  // Check for both horizontal and vertical lines
  const horizontalLines = lines.filter(
    (line) => Math.abs(line.start.y - line.end.y) < 5
  )
  const verticalLines = lines.filter(
    (line) => Math.abs(line.start.x - line.end.x) < 5
  )

  // Need both types for a fretboard
  if (horizontalLines.length < 2 || verticalLines.length < 3) {
    return 0.3
  }

  // Higher confidence with more lines
  const lineScore = Math.min(lines.length / 20, 1.0)

  // Check for regularity (even spacing suggests frets)
  const regularityScore = checkLineRegularity(horizontalLines)

  return lineScore * 0.6 + regularityScore * 0.4
}

/**
 * Check if lines are regularly spaced (indicates frets)
 */
function checkLineRegularity(lines: Line[]): number {
  if (lines.length < 3) {
    return 0
  }

  // Sort by position
  const sorted = [...lines].sort((a, b) => a.start.y - b.start.y)

  // Calculate spacing
  const spacings: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const spacing = sorted[i].start.y - sorted[i - 1].start.y
    spacings.push(spacing)
  }

  // Check variance (lower variance = more regular)
  const mean = spacings.reduce((a, b) => a + b, 0) / spacings.length
  const variance =
    spacings.reduce((sum, s) => sum + (s - mean) ** 2, 0) / spacings.length
  const stdDev = Math.sqrt(variance)

  // Normalize (lower std dev = higher score)
  return Math.max(0, 1 - stdDev / mean)
}
