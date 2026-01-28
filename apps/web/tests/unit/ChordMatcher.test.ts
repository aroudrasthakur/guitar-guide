import { describe, it, expect } from 'vitest'
import { scoreChord } from '@/packages/shared/scoring'
import type { FingerAssignment, ChordTemplate } from '@/lib/types'

describe('Chord Matching', () => {
  const eMajorTemplate: ChordTemplate = {
    name: 'E Major',
    strings: {
      6: { type: 'open' },
      5: { type: 'fretted', fret: 2, finger: 2 },
      4: { type: 'fretted', fret: 2, finger: 3 },
      3: { type: 'fretted', fret: 1, finger: 1 },
      2: { type: 'open' },
      1: { type: 'open' },
    },
  }

  it('should score perfect E major chord correctly', () => {
    const fingers: FingerAssignment[] = [
      { fingerId: 1, stringIdx: 3, fretIdx: 1, confidence: 0.9, position: { x: 0, y: 0 } },
      { fingerId: 2, stringIdx: 5, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } },
      { fingerId: 3, stringIdx: 4, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } },
    ]

    const result = scoreChord(fingers, eMajorTemplate)
    expect(result.score).toBeGreaterThan(0.8)
    expect(result.perString[3].ok).toBe(true)
    expect(result.perString[5].ok).toBe(true)
    expect(result.perString[4].ok).toBe(true)
  })

  it('should penalize wrong fret positions', () => {
    const fingers: FingerAssignment[] = [
      { fingerId: 1, stringIdx: 3, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } }, // Wrong fret
      { fingerId: 2, stringIdx: 5, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } },
      { fingerId: 3, stringIdx: 4, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } },
    ]

    const result = scoreChord(fingers, eMajorTemplate)
    expect(result.score).toBeLessThan(0.8)
    expect(result.perString[3].ok).toBe(false)
  })

  it('should handle missing fingers', () => {
    const fingers: FingerAssignment[] = [
      { fingerId: 2, stringIdx: 5, fretIdx: 2, confidence: 0.9, position: { x: 0, y: 0 } },
      // Missing fingers for strings 3 and 4
    ]

    const result = scoreChord(fingers, eMajorTemplate)
    expect(result.score).toBeLessThan(0.6)
    expect(result.perString[3].ok).toBe(false)
    expect(result.perString[4].ok).toBe(false)
  })

  it('should handle open strings correctly', () => {
    const fingers: FingerAssignment[] = [
      // No fingers on open strings
      { fingerId: 1, stringIdx: 3, fretIdx: 1, confidence: 0.9, position: { x: 0, y: 0 } },
    ]

    const result = scoreChord(fingers, eMajorTemplate)
    expect(result.perString[6].ok).toBe(true) // Open string
    expect(result.perString[2].ok).toBe(true) // Open string
    expect(result.perString[1].ok).toBe(true) // Open string
  })
})
