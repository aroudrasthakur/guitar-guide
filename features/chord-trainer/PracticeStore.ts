// Zustand store for practice session state

import { create } from 'zustand'
import type { PracticeSession, SessionResult } from '@/lib/types'

interface PracticeState {
  currentChord: string | null
  score: number
  stabilityMs: number
  history: SessionResult[]
  isTransitionMode: boolean
  transitionChords: [string, string] | null
  setCurrentChord: (chord: string | null) => void
  updateScore: (score: number, stabilityMs: number) => void
  addSessionResult: (result: SessionResult) => void
  setTransitionMode: (chords: [string, string] | null) => void
  reset: () => void
}

export const usePracticeStore = create<PracticeState>((set) => ({
  currentChord: null,
  score: 0,
  stabilityMs: 0,
  history: [],
  isTransitionMode: false,
  transitionChords: null,

  setCurrentChord: (chord) => set({ currentChord: chord }),

  updateScore: (score, stabilityMs) => set({ score, stabilityMs }),

  addSessionResult: (result) =>
    set((state) => ({
      history: [...state.history, result],
    })),

  setTransitionMode: (chords) =>
    set({
      isTransitionMode: chords !== null,
      transitionChords: chords,
      currentChord: chords ? chords[0] : null,
    }),

  reset: () =>
    set({
      currentChord: null,
      score: 0,
      stabilityMs: 0,
      isTransitionMode: false,
      transitionChords: null,
    }),
}))
