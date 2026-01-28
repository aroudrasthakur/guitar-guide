// One Euro Filter for smoothing hand keypoints
// Based on: https://cristal.univ-lille.fr/~casiez/1euro/

export interface OneEuroFilterConfig {
  minCutoff: number // Minimum cutoff frequency (Hz)
  beta: number // Speed cutoff coefficient
  dCutoff?: number // Derivative cutoff frequency (Hz)
}

export class OneEuroFilter {
  private x: number
  private dx: number
  private lastTime: number
  private config: Required<OneEuroFilterConfig>

  constructor(config: OneEuroFilterConfig) {
    this.config = {
      minCutoff: config.minCutoff,
      beta: config.beta,
      dCutoff: config.dCutoff || 1.0,
    }
    this.x = 0
    this.dx = 0
    this.lastTime = 0
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === 0) {
      this.x = value
      this.lastTime = timestamp
      return value
    }

    const dt = (timestamp - this.lastTime) / 1000.0 // Convert to seconds
    if (dt <= 0) {
      return this.x
    }

    // Update derivative estimate
    const dx = (value - this.x) / dt
    const edx = this.alpha(this.config.dCutoff, dt)
    this.dx = edx * dx + (1 - edx) * this.dx

    // Update filtered value
    const cutoff = this.config.minCutoff + this.config.beta * Math.abs(this.dx)
    const ea = this.alpha(cutoff, dt)
    this.x = ea * value + (1 - ea) * this.x

    this.lastTime = timestamp
    return this.x
  }

  reset(): void {
    this.x = 0
    this.dx = 0
    this.lastTime = 0
  }
}

/**
 * Create a filter for 2D points
 */
export class Point2DFilter {
  private xFilter: OneEuroFilter
  private yFilter: OneEuroFilter

  constructor(config: OneEuroFilterConfig) {
    this.xFilter = new OneEuroFilter(config)
    this.yFilter = new OneEuroFilter(config)
  }

  filter(point: { x: number; y: number }, timestamp: number): {
    x: number
    y: number
  } {
    return {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
    }
  }

  reset(): void {
    this.xFilter.reset()
    this.yFilter.reset()
  }
}

/**
 * Create filters for all hand keypoints
 */
export class HandKeypointFilter {
  private filters: Point2DFilter[]

  constructor(
    numKeypoints: number = 21,
    config: OneEuroFilterConfig = {
      minCutoff: 1.0,
      beta: 0.5,
      dCutoff: 1.0,
    }
  ) {
    this.filters = Array.from({ length: numKeypoints }, () => {
      return new Point2DFilter(config)
    })
  }

  filter(
    keypoints: Array<{ x: number; y: number; z?: number }>,
    timestamp: number
  ): Array<{ x: number; y: number; z?: number }> {
    return keypoints.map((kp, idx) => {
      const filtered = this.filters[idx].filter(
        { x: kp.x, y: kp.y },
        timestamp
      )
      return {
        ...filtered,
        z: kp.z,
      }
    })
  }

  reset(): void {
    this.filters.forEach((filter) => filter.reset())
  }
}
