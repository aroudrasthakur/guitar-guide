// MediaPipe Hands wrapper for hand tracking

import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'
import type { Hand, HandKeypoint } from '@/lib/types'
import { HandKeypointFilter } from './OneEuroFilter'

export interface HandTrackerConfig {
  modelAssetPath?: string
  numHands?: number
  minHandDetectionConfidence?: number
  minHandPresenceConfidence?: number
  minTrackingConfidence?: number
  runningMode?: 'IMAGE' | 'VIDEO'
}

export class HandTracker {
  private landmarker: HandLandmarker | null = null
  private isInitialized = false
  private keypointFilter: HandKeypointFilter

  constructor(config: HandTrackerConfig = {}) {
    this.keypointFilter = new HandKeypointFilter(21, {
      minCutoff: 1.0,
      beta: 0.5,
      dCutoff: 1.0,
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      )

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        runningMode: 'VIDEO',
      })

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize HandLandmarker:', error)
      throw error
    }
  }

  async detect(
    image: ImageBitmap | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    timestamp: number = Date.now()
  ): Promise<Hand[]> {
    if (!this.isInitialized || !this.landmarker) {
      await this.initialize()
    }

    if (!this.landmarker) {
      throw new Error('HandLandmarker not initialized')
    }

    try {
      const result: HandLandmarkerResult = this.landmarker.detectForVideo(
        image,
        timestamp
      )

      if (!result.landmarks || result.landmarks.length === 0) {
        return []
      }

      const hands: Hand[] = result.landmarks
        .map((landmarks, idx) => {
          if (!landmarks || landmarks.length === 0) {
            return null
          }

          const keypoints: HandKeypoint[] = landmarks.map((lm) => ({
            x: lm.x ?? 0,
            y: lm.y ?? 0,
            z: lm.z ?? 0,
          }))

          // Apply One Euro filter for smoothing
          const filteredKeypoints = this.keypointFilter.filter(
            keypoints,
            timestamp
          )

          return {
            keypoints: filteredKeypoints,
            handedness:
              result.handednesses?.[idx]?.[0]?.categoryName === 'Left'
                ? 'Left'
                : 'Right',
            score: result.handednesses?.[idx]?.[0]?.score || 0,
          }
        })
        .filter((hand): hand is Hand => hand !== null)

      return hands
    } catch (error) {
      console.error('Hand detection error:', error)
      return []
    }
  }

  reset(): void {
    this.keypointFilter.reset()
  }

  dispose(): void {
    // MediaPipe doesn't expose a dispose method, but we can reset state
    this.landmarker = null
    this.isInitialized = false
    this.keypointFilter.reset()
  }
}
