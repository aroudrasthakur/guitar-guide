// Main fretboard localization pipeline

import type { FretboardState, Point2D, Line } from '@/lib/types'
import { detectLines } from './HoughDetector'
import { computeHomography, identityHomography } from '@/features/calibration/homography'

export interface FretboardDetectionResult extends FretboardState {
  needsManualCalibration: boolean
}

/**
 * Estimate fretboard from image using heuristic detection
 */
export function estimateFretboard(
  imageData: ImageData | null,
  manualPoints?: {
    nutLeft: Point2D
    nutRight: Point2D
    fretLeft: Point2D
    fretRight: Point2D
  }
): FretboardDetectionResult {
  if (!imageData) {
    return {
      homography: null,
      strings: [],
      frets: [],
      confidence: 0,
      needsManualCalibration: true,
    }
  }
  // If manual points provided, use them
  if (manualPoints) {
    return estimateFromManualPoints(manualPoints, imageData.width, imageData.height)
  }

  // Otherwise, use heuristic detection
  const lineResult = detectLines(imageData)

  if (lineResult.confidence < 0.6) {
    return {
      homography: null,
      strings: [],
      frets: [],
      confidence: lineResult.confidence,
      needsManualCalibration: true,
    }
  }

  // Separate horizontal (frets) and vertical (strings) lines
  const horizontalLines = lineResult.lines.filter(
    (line) => Math.abs(line.start.y - line.end.y) < 5
  )
  const verticalLines = lineResult.lines.filter(
    (line) => Math.abs(line.start.x - line.end.x) < 5
  )

  // Estimate ROI from line intersections
  const roi = estimateROI(horizontalLines, verticalLines, imageData.width, imageData.height)

  // Compute homography (simplified - use manual calibration for better results)
  const homography = estimateHomographyFromLines(
    horizontalLines,
    verticalLines,
    roi,
    imageData.width,
    imageData.height
  )

  // Project 6 evenly-spaced string lines
  const strings = projectStringLines(homography, roi, imageData.width, imageData.height)

  // Detect fret positions
  const frets = detectFretPositions(horizontalLines, roi)

  return {
    homography,
    strings,
    frets,
    confidence: lineResult.confidence,
    roi,
    needsManualCalibration: lineResult.confidence < 0.7,
  }
}

/**
 * Estimate fretboard from manual calibration points
 */
function estimateFromManualPoints(
  points: {
    nutLeft: Point2D
    nutRight: Point2D
    fretLeft: Point2D
    fretRight: Point2D
  },
  width: number,
  height: number
): FretboardDetectionResult {
  // Validate points
  const allPoints = [points.nutLeft, points.nutRight, points.fretLeft, points.fretRight]
  if (allPoints.some(p => !p || typeof p.x !== 'number' || typeof p.y !== 'number' || !isFinite(p.x) || !isFinite(p.y))) {
    return {
      homography: null,
      strings: [],
      frets: [],
      confidence: 0,
      needsManualCalibration: true,
    }
  }

  // Define target rectangle in normalized space
  const targetPoints: Point2D[] = [
    { x: 0, y: 0 }, // Top-left
    { x: 1, y: 0 }, // Top-right
    { x: 0, y: 1 }, // Bottom-left
    { x: 1, y: 1 }, // Bottom-right
  ]

  const sourcePoints: Point2D[] = [
    points.nutLeft,
    points.nutRight,
    points.fretLeft,
    points.fretRight,
  ]

  // Compute homography
  const homography = computeHomography(sourcePoints, targetPoints)

  if (!homography) {
    return {
      homography: null,
      strings: [],
      frets: [],
      confidence: 0,
      needsManualCalibration: true,
    }
  }

  // Project string and fret lines
  const strings = projectStringLines(homography, undefined, width, height)
  const frets = projectFretLinesFromPoints(points, homography, width, height)

  return {
    homography,
    strings,
    frets,
    confidence: 0.9, // High confidence for manual calibration
    needsManualCalibration: false,
  }
}

/**
 * Estimate ROI from detected lines
 */
function estimateROI(
  horizontalLines: Line[],
  verticalLines: Line[],
  width: number,
  height: number
): FretboardState['roi'] {
  if (horizontalLines.length === 0 || verticalLines.length === 0) {
    return {
      x: width * 0.2,
      y: height * 0.2,
      width: width * 0.6,
      height: height * 0.6,
    }
  }

  // Find bounding box of line intersections
  const validVerticalLines = verticalLines.filter(l => l && l.start && l.end)
  const validHorizontalLines = horizontalLines.filter(l => l && l.start && l.end)

  if (validVerticalLines.length === 0 || validHorizontalLines.length === 0) {
    return {
      x: width * 0.2,
      y: height * 0.2,
      width: width * 0.6,
      height: height * 0.6,
    }
  }

  const minX = Math.min(...validVerticalLines.map((l) => Math.min(l.start.x, l.end.x)))
  const maxX = Math.max(...validVerticalLines.map((l) => Math.max(l.start.x, l.end.x)))
  const minY = Math.min(...validHorizontalLines.map((l) => Math.min(l.start.y, l.end.y)))
  const maxY = Math.max(...validHorizontalLines.map((l) => Math.max(l.start.y, l.end.y)))

  return {
    x: Math.max(0, minX - 10),
    y: Math.max(0, minY - 10),
    width: Math.min(width, maxX - minX + 20),
    height: Math.min(height, maxY - minY + 20),
  }
}

/**
 * Estimate homography from detected lines
 */
function estimateHomographyFromLines(
  horizontalLines: Line[],
  verticalLines: Line[],
  roi: FretboardState['roi'] | undefined,
  width: number,
  height: number
): number[][] {
  if (!roi || horizontalLines.length < 2 || verticalLines.length < 2) {
    return identityHomography()
  }

  // Validate ROI
  if (roi.width <= 0 || roi.height <= 0 || roi.x < 0 || roi.y < 0) {
    return identityHomography()
  }

  // Use ROI corners as source points
  const sourcePoints: Point2D[] = [
    { x: roi.x, y: roi.y },
    { x: roi.x + roi.width, y: roi.y },
    { x: roi.x, y: roi.y + roi.height },
    { x: roi.x + roi.width, y: roi.y + roi.height },
  ]

  // Target normalized rectangle
  const targetPoints: Point2D[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ]

  const homography = computeHomography(sourcePoints, targetPoints)
  return homography || identityHomography()
}

/**
 * Project 6 evenly-spaced string lines
 */
function projectStringLines(
  homography: number[][],
  roi: FretboardState['roi'] | undefined,
  width: number,
  height: number
): Line[] {
  const strings: Line[] = []
  const numStrings = 6

  // Define string positions in normalized space (0-1)
  for (let i = 0; i < numStrings; i++) {
    const normalizedX = (i + 0.5) / numStrings // Center of each string

    // Project top and bottom points
    const topPoint = { x: normalizedX, y: 0 }
    const bottomPoint = { x: normalizedX, y: 1 }

    // Transform back to image space (inverse homography)
    // For MVP, we'll use a simplified approach
    const topImage = projectPointInverse(homography, topPoint, width, height)
    const bottomImage = projectPointInverse(homography, bottomPoint, width, height)

    strings.push({
      start: topImage,
      end: bottomImage,
    })
  }

  return strings
}

/**
 * Detect fret positions from horizontal lines
 */
function detectFretPositions(horizontalLines: Line[], roi?: FretboardState['roi']): Line[] {
  if (horizontalLines.length === 0) {
    return []
  }

  // Sort by Y position
  const sorted = [...horizontalLines].sort((a, b) => a.start.y - b.start.y)

  // Filter to ROI if provided
  let filtered = sorted
  if (roi) {
    filtered = sorted.filter(
      (line) =>
        line.start.y >= roi.y &&
        line.start.y <= roi.y + roi.height
    )
  }

  // Return first 5 frets (for open chords)
  return filtered.slice(0, 5)
}

/**
 * Project fret lines from manual calibration points
 */
function projectFretLinesFromPoints(
  points: {
    nutLeft: Point2D
    nutRight: Point2D
    fretLeft: Point2D
    fretRight: Point2D
  },
  homography: number[][] | null,
  width: number,
  height: number
): Line[] {
  const frets: Line[] = []

  // Validate points
  if (
    !points.nutLeft ||
    !points.nutRight ||
    !points.fretLeft ||
    !points.fretRight
  ) {
    return frets
  }

  // Nut line (fret 0)
  frets.push({
    start: points.nutLeft,
    end: points.nutRight,
  })

  // Estimate additional frets using geometric progression
  const nutY = points.nutLeft.y
  const fretY = points.fretLeft.y
  const spacing = fretY - nutY

  if (spacing <= 0) {
    return frets
  }

  // Calculate spacing per fret (assuming reference is 3rd fret)
  const referenceFretNumber = 3
  const spacingPerFret = spacing / referenceFretNumber

  // Add reference fret (3rd)
  frets.push({
    start: points.fretLeft,
    end: points.fretRight,
  })

  // Add additional frets (1st, 2nd, 4th, 5th)
  for (let i = 1; i <= 5; i++) {
    if (i === 3) continue // Already added
    const y = points.nutLeft.y + spacingPerFret * i
    frets.push({
      start: { x: points.nutLeft.x, y },
      end: { x: points.nutRight.x, y },
    })
  }

  return frets
}

/**
 * Project point using inverse homography (simplified)
 */
function projectPointInverse(
  homography: number[][],
  point: Point2D,
  width: number,
  height: number
): Point2D {
  // For MVP, use simplified inverse transform
  // In production, use proper matrix inversion
  if (!homography || homography.length < 3) {
    return { x: point.x * width, y: point.y * height }
  }

  const [a, b, c] = homography[0] || [1, 0, 0]
  const [d, e, f] = homography[1] || [0, 1, 0]
  const [g, h, i] = homography[2] || [0, 0, 1]

  const x = point.x * width
  const y = point.y * height

  // Apply homography transformation
  const w = g * x + h * y + i
  if (Math.abs(w) < 1e-10) {
    return { x: x * a + c, y: y * e + f }
  }

  return {
    x: (x * a + y * b + c) / w,
    y: (x * d + y * e + f) / w,
  }
}
