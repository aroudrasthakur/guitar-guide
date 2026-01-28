// Homography matrix utilities for fretboard plane transformation

import type { Point2D } from '@/lib/types'

export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
]

/**
 * Multiply a 3x3 matrix by a 2D point (homogeneous coordinates)
 */
export function multiplyMatrixPoint(
  matrix: Matrix3x3,
  point: Point2D
): Point2D {
  const [x, y] = [point.x, point.y]
  const [a, b, c] = matrix[0]
  const [d, e, f] = matrix[1]
  const [g, h, i] = matrix[2]

  const w = g * x + h * y + i
  if (Math.abs(w) < 1e-10) {
    return { x: 0, y: 0 }
  }

  return {
    x: (a * x + b * y + c) / w,
    y: (d * x + e * y + f) / w,
  }
}

/**
 * Compute homography matrix from 4 point correspondences
 * Using Direct Linear Transform (DLT) algorithm
 */
export function computeHomography(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): Matrix3x3 | null {
  if (srcPoints.length !== 4 || dstPoints.length !== 4) {
    throw new Error('Homography requires exactly 4 point pairs')
  }

  // Build the A matrix for DLT
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = [srcPoints[i].x, srcPoints[i].y]
    const [u, v] = [dstPoints[i].x, dstPoints[i].y]

    A.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
    A.push([0, 0, 0, -x, -y, -1, v * x, v * y, v])
  }

  // Solve using SVD (simplified - in production use a proper SVD library)
  // For MVP, we'll use a simpler approach with known point order
  return computeHomographyFromQuadrilateral(srcPoints, dstPoints)
}

/**
 * Compute homography from quadrilateral to rectangle
 * Assumes srcPoints form a quadrilateral and dstPoints form a rectangle
 */
function computeHomographyFromQuadrilateral(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): Matrix3x3 {
  if (srcPoints.length !== 4 || dstPoints.length !== 4) {
    throw new Error('Quadrilateral homography requires 4 points')
  }

  // Normalize points to improve numerical stability
  const srcNorm = normalizePoints(srcPoints)
  const dstNorm = normalizePoints(dstPoints)

  // Build coefficient matrix
  const A: number[][] = []
  const b: number[] = []

  for (let i = 0; i < 4; i++) {
    const [x, y] = [srcNorm[i].x, srcNorm[i].y]
    const [u, v] = [dstNorm[i].x, dstNorm[i].y]

    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(u, v)
  }

  // Solve linear system Ax = b using Gaussian elimination (simplified)
  const h = solveLinearSystem(A, b)

  // Denormalize
  const srcT = srcNorm[4] // transformation matrix stored in 5th element
  const dstT = dstNorm[4]

  // Reconstruct homography matrix
  const H: Matrix3x3 = [
    [
      h[0] * dstT.scaleX,
      h[1] * dstT.scaleX,
      h[2] * dstT.scaleX + dstT.tx,
    ],
    [
      h[3] * dstT.scaleY,
      h[4] * dstT.scaleY,
      h[5] * dstT.scaleY + dstT.ty,
    ],
    [h[6], h[7], 1],
  ]

  // Apply inverse normalization
  const invSrcT = {
    scaleX: 1 / srcT.scaleX,
    scaleY: 1 / srcT.scaleY,
    tx: -srcT.tx / srcT.scaleX,
    ty: -srcT.ty / srcT.scaleY,
  }

  // Compose transformations
  const finalH: Matrix3x3 = [
    [
      H[0][0] * invSrcT.scaleX,
      H[0][1] * invSrcT.scaleX,
      H[0][0] * invSrcT.tx + H[0][1] * invSrcT.ty + H[0][2],
    ],
    [
      H[1][0] * invSrcT.scaleY,
      H[1][1] * invSrcT.scaleY,
      H[1][0] * invSrcT.tx + H[1][1] * invSrcT.ty + H[1][2],
    ],
    [
      H[2][0] * invSrcT.scaleX,
      H[2][1] * invSrcT.scaleY,
      H[2][0] * invSrcT.tx + H[2][1] * invSrcT.ty + H[2][2],
    ],
  ]

  return finalH
}

interface NormalizationResult {
  scaleX: number
  scaleY: number
  tx: number
  ty: number
}

function normalizePoints(
  points: Point2D[]
): Point2D[] & { [4]: NormalizationResult } {
  if (points.length === 0) {
    throw new Error('Cannot normalize empty point array')
  }

  // Calculate centroid
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length

  // Calculate average distance from centroid
  const distances = points.map((p) =>
    Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
  )
  const avgDist =
    distances.reduce((sum, d) => sum + d, 0) / distances.length

  // Avoid division by zero
  const scale = avgDist > 1e-10 ? Math.sqrt(2) / avgDist : 1

  // Normalize points
  const normalized = points.map((p) => ({
    x: (p.x - cx) * scale,
    y: (p.y - cy) * scale,
  }))

  // Store transformation
  const result = normalized as Point2D[] & { [4]: NormalizationResult }
  result[4] = {
    scaleX: scale,
    scaleY: scale,
    tx: -cx * scale,
    ty: -cy * scale,
  }

  return result
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  // Simplified Gaussian elimination for 8x8 system
  const n = A.length
  if (n === 0 || b.length !== n) {
    throw new Error('Invalid system dimensions')
  }

  const augmented = A.map((row, i) => {
    if (row.length !== n) {
      throw new Error(`Row ${i} has incorrect length`)
    }
    return [...row, b[i]]
  })

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      // Use identity as fallback
      return [1, 0, 0, 0, 1, 0, 0, 0]
    }

    // Eliminate
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i]
      for (let j = i; j < n + 1; j++) {
        augmented[k][j] -= factor * augmented[i][j]
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j]
    }
    if (Math.abs(augmented[i][i]) > 1e-10) {
      x[i] /= augmented[i][i]
    }
  }

  return x
}

/**
 * Project points from image space to rectified fretboard plane
 */
export function projectPoints(
  homography: Matrix3x3,
  points: Point2D[]
): Point2D[] {
  return points.map((point) => multiplyMatrixPoint(homography, point))
}

/**
 * Create identity homography matrix
 */
export function identityHomography(): Matrix3x3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
}
