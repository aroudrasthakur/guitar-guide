// Map fingertips to string and fret positions

import type { Point2D, Line, FingerAssignment } from '@/lib/types'
import { projectPoints } from '@/features/calibration/homography'
import type { Matrix3x3 } from '@/features/calibration/homography'

export interface MappingResult {
  assignments: FingerAssignment[]
  confidence: number
}

/**
 * Map fingertips to string and fret positions
 */
export function mapToStringsAndFrets(
  fingertips: Array<{ fingerId: number; position: Point2D }>,
  homography: Matrix3x3,
  strings: Line[],
  frets: Line[],
  imageWidth: number,
  imageHeight: number
): MappingResult {
  // Project fingertips to rectified plane
  const planePoints = projectPoints(
    homographyMatrix as Matrix3x3,
    fingertips.map((f) => f.position)
  )

  const assignments: FingerAssignment[] = []

  for (let i = 0; i < fingertips.length; i++) {
    const planePoint = planePoints[i]
    const fingerId = fingertips[i].fingerId

    // Find nearest string
    const stringIdx = findNearestString(planePoint, strings)

    // Find nearest fret
    const fretIdx = findNearestFret(planePoint, frets)

    // Calculate confidence based on distance to string/fret
    const stringLine = strings[stringIdx - 1]
    if (!stringLine || fretIdx < 0 || fretIdx >= frets.length) {
      assignments.push({
        fingerId,
        stringIdx: 1,
        fretIdx: 0,
        confidence: 0,
        position: fingertips[i].position,
      })
      continue
    }

    const fretLine = frets[fretIdx]
    const stringDist = distanceToLine(planePoint, stringLine)
    const fretDist = distanceToFret(planePoint, fretLine)
    const confidence = Math.max(
      0,
      1 - (stringDist / 0.1 + fretDist / 0.1) / 2
    )

    assignments.push({
      fingerId,
      stringIdx,
      fretIdx,
      confidence,
      position: fingertips[i].position,
    })
  }

  // Apply consistency checks to prevent flips
  enforceStringOrder(assignments)

  return {
    assignments,
    confidence: assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length,
  }
}

/**
 * Find nearest string index (1-6)
 */
function findNearestString(point: Point2D, strings: Line[]): number {
  if (strings.length === 0) {
    return 1
  }

  let minDist = Infinity
  let nearestIdx = 1

  for (let i = 0; i < strings.length; i++) {
    if (!strings[i]) continue
    const dist = distanceToLine(point, strings[i])
    if (dist < minDist) {
      minDist = dist
      nearestIdx = i + 1 // Strings are 1-indexed
    }
  }

  return nearestIdx
}

/**
 * Find nearest fret index (0 = open, 1+ = fretted)
 */
function findNearestFret(point: Point2D, frets: Line[]): number {
  if (frets.length === 0) {
    return 0
  }

  // Find which fret band the point lies in
  for (let i = 0; i < frets.length; i++) {
    if (!frets[i]) continue
    const fretY = frets[i].start.y
    if (point.y < fretY) {
      return i // Fret index (0-indexed, but 0 = open)
    }
  }

  return frets.length
}

/**
 * Calculate distance from point to line
 */
function distanceToLine(point: Point2D, line: Line): number {
  const dx = line.end.x - line.start.x
  const dy = line.end.y - line.start.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) {
    return Math.sqrt(
      (point.x - line.start.x) ** 2 + (point.y - line.start.y) ** 2
    )
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) /
        (length * length)
    )
  )

  const projX = line.start.x + t * dx
  const projY = line.start.y + t * dy

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
}

/**
 * Calculate distance from point to fret line
 */
function distanceToFret(point: Point2D, fret: Line | undefined): number {
  if (!fret) {
    return Infinity
  }
  // For horizontal frets, distance is vertical distance
  return Math.abs(point.y - fret.start.y)
}

/**
 * Enforce string order consistency to prevent flips
 */
function enforceStringOrder(assignments: FingerAssignment[]): void {
  // Sort by string index
  const sorted = [...assignments].sort((a, b) => a.stringIdx - b.stringIdx)

  // Check for order violations (fingers should be in order)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    // If finger IDs are out of order relative to string positions, swap
    if (prev.fingerId > curr.fingerId && prev.stringIdx < curr.stringIdx) {
      // This suggests a flip - adjust confidence
      prev.confidence *= 0.8
      curr.confidence *= 0.8
    }
  }
}

/**
 * Detect if finger is "pressed" vs "hovering"
 */
export function isFingerPressed(
  assignment: FingerAssignment,
  stabilityHistory: FingerAssignment[]
): boolean {
  // Check stability (low velocity)
  if (stabilityHistory.length < 3) {
    return false
  }

  const recent = stabilityHistory.slice(-3)
  const positions = recent.map((a) => a.position)

  // Calculate average velocity
  let totalVelocity = 0
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x
    const dy = positions[i].y - positions[i - 1].y
    totalVelocity += Math.sqrt(dx * dx + dy * dy)
  }

  const avgVelocity = totalVelocity / (positions.length - 1)

  // Low velocity + high confidence = pressed
  return avgVelocity < 0.01 && assignment.confidence > 0.7
}
