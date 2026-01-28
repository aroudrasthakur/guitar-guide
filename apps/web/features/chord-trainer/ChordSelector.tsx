'use client'

import { CHORD_NAMES } from '@/packages/shared/chord-templates'

interface ChordSelectorProps {
  selectedChord: string | null
  onSelectChord: (chord: string) => void
  className?: string
}

export default function ChordSelector({
  selectedChord,
  onSelectChord,
  className = '',
}: ChordSelectorProps) {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {CHORD_NAMES.map((chord) => (
        <button
          key={chord}
          onClick={() => onSelectChord(chord)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedChord === chord
              ? 'border-blue-600 bg-blue-50 font-bold'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {chord}
        </button>
      ))}
    </div>
  )
}
