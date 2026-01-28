'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalibrationStore } from '@/features/calibration/CalibrationStore'

export default function OnboardingPage() {
  const router = useRouter()
  const { setGuitarType, setHandedness } = useCalibrationStore()
  const [step, setStep] = useState(1)
  const [selectedHandedness, setSelectedHandedness] = useState<'right' | 'left' | null>(null)
  const [selectedGuitarType, setSelectedGuitarType] = useState<'acoustic' | 'electric' | null>(null)

  const handleNext = () => {
    if (step === 1 && selectedHandedness) {
      setHandedness(selectedHandedness)
      setStep(2)
    } else if (step === 2 && selectedGuitarType) {
      setGuitarType(selectedGuitarType)
      setStep(3)
    } else if (step === 3) {
      router.push('/calibrate')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-900 to-blue-700">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Welcome to Guitar Guide
        </h1>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              Are you right-handed or left-handed?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedHandedness('right')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedHandedness === 'right'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">✋</div>
                <div className="font-medium">Right-handed</div>
              </button>
              <button
                onClick={() => setSelectedHandedness('left')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedHandedness === 'left'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">🤚</div>
                <div className="font-medium">Left-handed</div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">
              What type of guitar are you using?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedGuitarType('acoustic')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedGuitarType === 'acoustic'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">🎸</div>
                <div className="font-medium">Acoustic</div>
              </button>
              <button
                onClick={() => setSelectedGuitarType('electric')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedGuitarType === 'electric'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">🎸</div>
                <div className="font-medium">Electric</div>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center mb-4">
              Setup Tips
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📹</div>
                <div>
                  <div className="font-medium mb-1">Show the fretboard in frame</div>
                  <div className="text-sm text-gray-600">
                    Position your guitar so the fretboard is clearly visible in the camera view
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📐</div>
                <div>
                  <div className="font-medium mb-1">Keep camera steady</div>
                  <div className="text-sm text-gray-600">
                    Place your device on a stable surface or use a tripod for best results
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <div className="font-medium mb-1">Good lighting</div>
                  <div className="text-sm text-gray-600">
                    Ensure the fretboard is well-lit and avoid harsh shadows or glare
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !selectedHandedness) ||
              (step === 2 && !selectedGuitarType)
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'Start Calibration' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  )
}
