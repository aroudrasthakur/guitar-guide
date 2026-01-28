// Chord template definitions for starter open chord set

import type { ChordTemplate } from '@/lib/types'

export const CHORD_TEMPLATES: Record<string, ChordTemplate> = {
  C: {
    name: 'C Major',
    strings: {
      6: { type: 'muted' }, // X
      5: { type: 'fretted', fret: 3, finger: 3 }, // Ring finger
      4: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      3: { type: 'open' }, // 0
      2: { type: 'fretted', fret: 1, finger: 1 }, // Index finger
      1: { type: 'open' }, // 0
    },
  },
  D: {
    name: 'D Major',
    strings: {
      6: { type: 'muted' }, // X
      5: { type: 'muted' }, // X
      4: { type: 'open' }, // 0
      3: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      2: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      1: { type: 'fretted', fret: 2, finger: 4 }, // Pinky
    },
  },
  E: {
    name: 'E Major',
    strings: {
      6: { type: 'open' }, // 0
      5: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      4: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      3: { type: 'fretted', fret: 1, finger: 1 }, // Index finger
      2: { type: 'open' }, // 0
      1: { type: 'open' }, // 0
    },
  },
  G: {
    name: 'G Major',
    strings: {
      6: { type: 'fretted', fret: 3, finger: 3 }, // Ring finger
      5: { type: 'open' }, // 0
      4: { type: 'open' }, // 0
      3: { type: 'open' }, // 0
      2: { type: 'fretted', fret: 3, finger: 4 }, // Pinky
      1: { type: 'fretted', fret: 3, finger: 2 }, // Middle finger
    },
  },
  A: {
    name: 'A Major',
    strings: {
      6: { type: 'open' }, // 0
      5: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      4: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      3: { type: 'fretted', fret: 2, finger: 4 }, // Pinky
      2: { type: 'open' }, // 0
      1: { type: 'open' }, // 0
    },
  },
  Am: {
    name: 'A Minor',
    strings: {
      6: { type: 'open' }, // 0
      5: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      4: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      3: { type: 'open' }, // 0
      2: { type: 'open' }, // 0
      1: { type: 'open' }, // 0
    },
  },
  Em: {
    name: 'E Minor',
    strings: {
      6: { type: 'open' }, // 0
      5: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      4: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      3: { type: 'open' }, // 0
      2: { type: 'open' }, // 0
      1: { type: 'open' }, // 0
    },
  },
  Dm: {
    name: 'D Minor',
    strings: {
      6: { type: 'muted' }, // X
      5: { type: 'muted' }, // X
      4: { type: 'open' }, // 0
      3: { type: 'fretted', fret: 2, finger: 2 }, // Middle finger
      2: { type: 'fretted', fret: 2, finger: 3 }, // Ring finger
      1: { type: 'fretted', fret: 1, finger: 1 }, // Index finger
    },
  },
}

export const CHORD_NAMES = Object.keys(CHORD_TEMPLATES)

export function getChordTemplate(name: string): ChordTemplate | null {
  return CHORD_TEMPLATES[name] || null
}
