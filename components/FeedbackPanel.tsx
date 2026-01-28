'use client'

import { useEffect, useState } from 'react'
import type { ChordMatchResult } from '@/lib/types'

interface FeedbackPanelProps {
  matchResult: ChordMatchResult | null
  messages: string[]
  className?: string
}

export default function FeedbackPanel({
  matchResult,
  messages,
  className = '',
}: FeedbackPanelProps) {
  const [displayMessages, setDisplayMessages] = useState<string[]>([])

  useEffect(() => {
    if (messages.length > 0) {
      setDisplayMessages(messages)
    }
  }, [messages])

  if (!matchResult) {
    return null
  }

  const scorePercentage = Math.round(matchResult.score * 100)
  const stabilitySeconds = (matchResult.stabilityMs / 1000).toFixed(1)

  return (
    <div
      className={`bg-black/80 text-white p-4 rounded-lg space-y-2 ${className}`}
    >
      {/* Score display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Score</span>
        <span
          className={`text-lg font-bold ${
            matchResult.score >= 0.9
              ? 'text-green-400'
              : matchResult.score >= 0.7
                ? 'text-yellow-400'
                : 'text-red-400'
          }`}
        >
          {scorePercentage}%
        </span>
      </div>

      {/* Stability timer */}
      {matchResult.stabilityMs > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm">Stability</span>
          <span className="text-sm">{stabilitySeconds}s / 2.0s</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            matchResult.score >= 0.9
              ? 'bg-green-400'
              : matchResult.score >= 0.7
                ? 'bg-yellow-400'
                : 'bg-red-400'
          }`}
          style={{ width: `${scorePercentage}%` }}
        />
      </div>

      {/* Feedback messages */}
      {displayMessages.length > 0 && (
        <div className="mt-2 space-y-1">
          {displayMessages.map((msg, idx) => (
            <p key={idx} className="text-sm">
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
