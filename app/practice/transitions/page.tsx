'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChordSelector from '@/features/chord-trainer/ChordSelector'
import { CHORD_NAMES } from '@/packages/shared/chord-templates'
import { usePracticeStore } from '@/features/chord-trainer/PracticeStore'

export default function TransitionsPracticePage() {
  const router = useRouter()
  const { setTransitionMode } = usePracticeStore()
  const [chordA, setChordA] = useState<string | null>(null)
  const [chordB, setChordB] = useState<string | null>(null)

  const handleStart = () => {
    if (chordA && chordB) {
      setTransitionMode([chordA, chordB])
      router.push('/practice/chords')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Transition Practice</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Select First Chord</h2>
            <ChordSelector
              selectedChord={chordA}
              onSelectChord={setChordA}
            />
          </div>

          <div className="text-center text-4xl">→</div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Select Second Chord</h2>
            <ChordSelector
              selectedChord={chordB}
              onSelectChord={setChordB}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleStart}
            disabled={!chordA || !chordB}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Practice
          </button>
        </div>
      </div>
    </main>
  )
}
