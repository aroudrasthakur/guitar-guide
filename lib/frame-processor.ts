// Main frame processing loop coordinating all CV components

import type {
  FrameState,
  Hand,
  FretboardState,
  FingerAssignment,
  ChordMatchResult,
} from '@/lib/types'
import { HandTracker } from '@/features/ml/hands/HandTracker'
import { assignHands, getFingertips } from '@/features/ml/hands/HandAssigner'
import { estimateFretboard } from '@/features/ml/fretboard/FretboardLocalizer'
import { mapToStringsAndFrets } from '@/features/ml/fretboard/StringFretMapper'
import { matchChord, generateFeedback, createStabilityTracker } from '@/features/chord-trainer/ChordMatcher'
import { getChordTemplate } from '@/packages/shared/chord-templates'
import { getDownsampledFrame, imageDataToImageBitmap } from './camera'
import type { Matrix3x3 } from '@/features/calibration/homography'

export interface FrameProcessorConfig {
  processingWidth: number
  processingHeight: number
  fretboardUpdateInterval: number // frames
}

const DEFAULT_CONFIG: FrameProcessorConfig = {
  processingWidth: 640,
  processingHeight: 360,
  fretboardUpdateInterval: 10,
}

export class FrameProcessor {
  private handTracker: HandTracker
  private config: FrameProcessorConfig
  private frameCount = 0
  private stabilityTracker = createStabilityTracker(0.85, 2000)
  private videoElement: HTMLVideoElement | null = null
  private callback: ((state: FrameState) => void) | null = null
  private isRunning = false
  private animationFrameId: number | null = null
  private getChordTarget: (() => string | null) | null = null
  private getHandedness: (() => 'right' | 'left') | null = null

  constructor(config: Partial<FrameProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.handTracker = new HandTracker()
  }

  setCallbacks(options: {
    getChordTarget?: () => string | null
    getHandedness?: () => 'right' | 'left'
  }): void {
    this.getChordTarget = options.getChordTarget || null
    this.getHandedness = options.getHandedness || (() => 'right')
  }

  async initialize(): Promise<void> {
    await this.handTracker.initialize()
  }

  start(
    videoElement: HTMLVideoElement,
    callback: (state: FrameState) => void
  ): void {
    this.videoElement = videoElement
    this.callback = callback
    this.isRunning = true
    this.processFrame()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.videoElement || !this.callback) {
      return
    }

    const startTime = performance.now()

    try {
      // Get downsampled frame
      const imageData = getDownsampledFrame(
        this.videoElement,
        this.config.processingWidth,
        this.config.processingHeight
      )

      if (!imageData) {
        this.scheduleNextFrame()
        return
      }

      const imageBitmap = await imageDataToImageBitmap(imageData)
      const timestamp = Date.now()

      // Initialize state
      const state: FrameState = {
        fretboard: {
          homography: null,
          strings: [],
          frets: [],
          confidence: 0,
        },
        hands: {
          fretting: null,
          strumming: null,
        },
        chordTarget: null,
        chordMatch: null,
        lastStrumTs: 0,
        metrics: {
          chordScore: 0,
          stableMs: 0,
        },
      }

      // Update fretboard detection (every N frames)
      // Try auto-detection periodically or when confidence is low
      const shouldUpdateFretboard =
        this.frameCount % this.config.fretboardUpdateInterval === 0 ||
        !state.fretboard.homography ||
        state.fretboard.confidence < 0.6

      if (shouldUpdateFretboard) {
        const fretboardResult = estimateFretboard(imageData)
        // Only update if we got a better result or don't have one yet
        if (
          !state.fretboard.homography ||
          fretboardResult.confidence > state.fretboard.confidence
        ) {
          state.fretboard = fretboardResult
        }
      }

      // Detect hands
      const hands = await this.handTracker.detect(imageBitmap, timestamp)
      if (hands.length > 0) {
        const handedness = this.getHandedness ? this.getHandedness() : 'right'
        state.hands = assignHands(hands, state.fretboard, handedness)
      }

      // Map fingertips to strings/frets if fretboard is ready
      let fingerAssignments: FingerAssignment[] = []
      if (
        state.fretboard.homography &&
        state.hands.fretting &&
        state.fretboard.strings.length > 0 &&
        state.fretboard.frets.length > 0
      ) {
        const fingertips = getFingertips(state.hands.fretting)
        if (fingertips.length > 0 && state.fretboard.homography) {
          const mappingResult = mapToStringsAndFrets(
            fingertips.map((f) => ({
              fingerId: f.fingerId,
              position: { x: f.position.x, y: f.position.y },
            })),
            state.fretboard.homography,
            state.fretboard.strings,
            state.fretboard.frets,
            this.config.processingWidth,
            this.config.processingHeight
          )
          fingerAssignments = mappingResult.assignments
        }
      }

      // Match chord if target is set
      const chordTarget = this.getChordTarget ? this.getChordTarget() : null
      if (chordTarget && fingerAssignments.length > 0) {
        const template = getChordTemplate(chordTarget)
        if (template) {
          state.chordTarget = chordTarget
          const matchResult = matchChord(
            fingerAssignments,
            template,
            this.stabilityTracker
          )
          state.chordMatch = matchResult
          state.metrics.chordScore = matchResult.score
          state.metrics.stableMs = matchResult.stabilityMs
        }
      }

      // Store finger assignments in state for access by UI
      state.fingerAssignments = fingerAssignments

      // Call callback with updated state
      this.callback(state)
    } catch (error) {
      console.error('Frame processing error:', error)
    }

    this.frameCount++
    this.scheduleNextFrame()
  }

  private scheduleNextFrame(): void {
    if (!this.isRunning) return

    // Use requestVideoFrameCallback if available, otherwise requestAnimationFrame
    if (
      this.videoElement &&
      'requestVideoFrameCallback' in this.videoElement
    ) {
      try {
        ;(this.videoElement as HTMLVideoElement & {
          requestVideoFrameCallback: (callback: () => void) => number
        }).requestVideoFrameCallback(() => {
          this.processFrame()
        })
      } catch (error) {
        // Fallback to requestAnimationFrame if requestVideoFrameCallback fails
        this.animationFrameId = requestAnimationFrame(() => {
          this.processFrame()
        })
      }
    } else {
      this.animationFrameId = requestAnimationFrame(() => {
        this.processFrame()
      })
    }
  }

  reset(): void {
    this.frameCount = 0
    this.stabilityTracker = createStabilityTracker(0.85, 2000)
    this.handTracker.reset()
  }

  setChordTarget(chord: string | null): void {
    // Reset stability tracker when chord changes
    if (chord !== this.getChordTarget?.()) {
      this.stabilityTracker = createStabilityTracker(0.85, 2000)
    }
  }

  dispose(): void {
    this.stop()
    this.handTracker.dispose()
  }
}
