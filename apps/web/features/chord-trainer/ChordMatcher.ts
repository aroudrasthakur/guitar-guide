// Chord matching with stability tracking

import type {
  FingerAssignment,
  ChordTemplate,
  ChordMatchResult,
} from '@/lib/types'
import { scoreChord } from '@/packages/shared/scoring'

export interface StabilityTracker {
  score: number
  stableMs: number
  lastUpdate: number
  threshold: number
  requiredStableMs: number
}

/**
 * Create a new stability tracker
 */
export function createStabilityTracker(
  threshold: number = 0.85,
  requiredStableMs: number = 2000
): StabilityTracker {
  return {
    score: 0,
    stableMs: 0,
    lastUpdate: Date.now(),
    threshold,
    requiredStableMs,
  }
}

/**
 * Update stability tracker with new chord score
 */
export function updateStability(
  tracker: StabilityTracker,
  newScore: number,
  timestamp: number = Date.now()
): StabilityTracker {
  if (!tracker || typeof newScore !== 'number' || !isFinite(newScore)) {
    return tracker
  }

  const dt = Math.max(0, timestamp - tracker.lastUpdate)

  if (newScore >= tracker.threshold) {
    // Score is above threshold - accumulate stable time
    tracker.stableMs += dt
  } else {
    // Score dropped below threshold - reset
    tracker.stableMs = 0
  }

  tracker.score = newScore
  tracker.lastUpdate = timestamp

  return tracker
}

/**
 * Check if chord is stable enough to pass
 */
export function isChordStable(tracker: StabilityTracker): boolean {
  return tracker.stableMs >= tracker.requiredStableMs
}

/**
 * Match fingers to chord template and compute score
 */
export function matchChord(
  fingers: FingerAssignment[],
  template: ChordTemplate,
  stabilityTracker?: StabilityTracker
): ChordMatchResult {
  const matchResult = scoreChord(fingers, template)

  if (stabilityTracker) {
    const updatedTracker = updateStability(
      stabilityTracker,
      matchResult.score
    )
    matchResult.stabilityMs = updatedTracker.stableMs
    // Update the tracker reference
    Object.assign(stabilityTracker, updatedTracker)
  }

  return matchResult
}

/**
 * Generate feedback messages from chord match result
 */
export function generateFeedback(
  matchResult: ChordMatchResult | null,
  chordName: string
): string[] {
  const messages: string[] = []

  if (!matchResult) {
    return ['Select a chord to begin']
  }

  // Overall score feedback
  if (matchResult.score >= 0.9) {
    messages.push('Excellent!')
  } else if (matchResult.score >= 0.7) {
    messages.push('Good, keep adjusting')
  } else if (matchResult.score >= 0.5) {
    messages.push('Getting there...')
  } else {
    messages.push('Keep practicing')
  }

  // Per-string feedback
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
  if (matchResult.perString) {
    for (let s = 1; s <= 6; s++) {
      const stringResult = matchResult.perString[s]
      if (!stringResult || stringResult.ok) {
        continue
      }

      if (stringResult.reason?.includes('wrong fret')) {
        const fingerId = stringResult.fingerId
        if (fingerId !== undefined && fingerId >= 0 && fingerId < fingerNames.length) {
          messages.push(
            `${fingerNames[fingerId]} finger: check fret position`
          )
        }
      } else if (stringResult.reason?.includes('missing')) {
        messages.push(`String ${s}: place finger`)
      } else if (stringResult.reason?.includes('blocking')) {
        messages.push(`String ${s}: remove finger`)
      }
    }
  }

  // Stability feedback
  if (matchResult.stabilityMs > 0 && matchResult.stabilityMs < 2000) {
    const remaining = ((2000 - matchResult.stabilityMs) / 1000).toFixed(1)
    messages.push(`Hold for ${remaining} more seconds`)
  } else if (matchResult.stabilityMs >= 2000) {
    messages.push('Perfect! Chord formed correctly.')
  }

  return messages
}
