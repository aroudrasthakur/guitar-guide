// Scoring utilities for chord matching

import type {
  FingerAssignment,
  ChordTemplate,
  StringMatchResult,
  ChordMatchResult,
} from '@/lib/types'

/**
 * Find the best finger assignment for a given string
 */
export function bestFingerOnString(
  fingers: FingerAssignment[],
  stringIdx: number
): FingerAssignment | null {
  if (!fingers || fingers.length === 0) {
    return null
  }

  const candidates = fingers.filter((f) => f && f.stringIdx === stringIdx)
  if (candidates.length === 0) {
    return null
  }

  // Return the one with highest confidence
  return candidates.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  )
}

/**
 * Compute penalty for extra fingers not in template
 */
export function computeExtraFingerPenalty(
  fingers: FingerAssignment[],
  template: ChordTemplate
): number {
  let extraCount = 0

  for (const finger of fingers) {
    const stringConstraint = template.strings[finger.stringIdx]
    if (!stringConstraint) {
      extraCount++
      continue
    }

    if (stringConstraint.type === 'muted') {
      // Fingers on muted strings are extra
      extraCount++
    } else if (stringConstraint.type === 'fretted') {
      // Check if finger matches expected fret
      if (finger.fretIdx !== stringConstraint.fret) {
        extraCount += 0.5 // Partial penalty for wrong fret
      }
    }
  }

  // Normalize penalty (max 0.2 of total score)
  return Math.min(extraCount * 0.05, 0.2)
}

/**
 * Score a chord match based on finger assignments and template
 */
export function scoreChord(
  fingers: FingerAssignment[],
  template: ChordTemplate
): ChordMatchResult {
  if (!template || !template.strings) {
    return {
      score: 0,
      perString: {},
      stabilityMs: 0,
    }
  }

  let score = 0
  let maxScore = 0
  const perString: { [key: number]: StringMatchResult } = {}

  // Score each string (1-6)
  for (let s = 1; s <= 6; s++) {
    maxScore += 1
    const expected = template.strings[s]
    const observed = bestFingerOnString(fingers || [], s)

    if (!expected) {
      // No constraint = don't penalize
      perString[s] = { ok: true, reason: 'no constraint' }
      score += 1
      continue
    }

    if (expected.type === 'muted') {
      // MVP cannot reliably detect muting, so don't penalize much
      perString[s] = { ok: true, reason: 'muting not enforced' }
      score += 0.6
      continue
    }

    if (expected.type === 'open') {
      // Open string: check no finger blocking
      if (observed === null || observed.fretIdx <= 0) {
        perString[s] = { ok: true }
        score += 1
      } else {
        perString[s] = {
          ok: false,
          reason: 'finger blocking open string',
        }
        score += 0
      }
      continue
    }

    // Expected fretted
    if (
      observed !== null &&
      Math.abs(observed.fretIdx - expected.fret) <= 0.5 // Tolerance
    ) {
      perString[s] = { ok: true, fingerId: observed.fingerId }
      score += 1
    } else {
      perString[s] = {
        ok: false,
        reason: observed
          ? `wrong fret (expected ${expected.fret}, got ${observed.fretIdx})`
          : 'missing finger',
      }
      score += 0
    }
  }

  // Penalize extra fingers
  const extraPenalty = computeExtraFingerPenalty(fingers, template)
  const finalScore = Math.max(0, Math.min(1, score / maxScore - extraPenalty))

  return {
    score: finalScore,
    perString,
    stabilityMs: 0, // Will be updated by caller
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
