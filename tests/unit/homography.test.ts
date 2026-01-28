import { describe, it, expect } from 'vitest'
import { computeHomography, multiplyMatrixPoint } from '@/features/calibration/homography'
import type { Point2D } from '@/lib/types'

describe('Homography', () => {
  it('should compute identity transformation for same points', () => {
    const points: Point2D[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]

    const homography = computeHomography(points, points)
    expect(homography).toBeDefined()

    // Transform should be close to identity
    const result = multiplyMatrixPoint(homography!, { x: 0.5, y: 0.5 })
    expect(Math.abs(result.x - 0.5)).toBeLessThan(0.1)
    expect(Math.abs(result.y - 0.5)).toBeLessThan(0.1)
  })

  it('should transform points correctly', () => {
    const srcPoints: Point2D[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ]

    const dstPoints: Point2D[] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 0, y: 200 },
      { x: 200, y: 200 },
    ]

    const homography = computeHomography(srcPoints, dstPoints)
    expect(homography).toBeDefined()

    // Test transformation
    const result = multiplyMatrixPoint(homography!, { x: 50, y: 50 })
    expect(Math.abs(result.x - 100)).toBeLessThan(10)
    expect(Math.abs(result.y - 100)).toBeLessThan(10)
  })
})
