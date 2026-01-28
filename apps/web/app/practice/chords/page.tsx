'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CameraPreview from '@/components/CameraPreview'
import OverlayCanvas from '@/components/OverlayCanvas'
import ChordOverlay from '@/features/chord-trainer/ChordOverlay'
import FeedbackPanel from '@/components/FeedbackPanel'
import ChordSelector from '@/features/chord-trainer/ChordSelector'
import { usePracticeStore } from '@/features/chord-trainer/PracticeStore'
import { useCalibrationStore } from '@/features/calibration/CalibrationStore'
import { FrameProcessor } from '@/lib/frame-processor'
import { generateFeedback } from '@/features/chord-trainer/ChordMatcher'
import type { FrameState, FingerAssignment } from '@/lib/types'

export default function ChordsPracticePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const processorRef = useRef<FrameProcessor | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const [frameState, setFrameState] = useState<FrameState | null>(null)
  const [feedbackMessages, setFeedbackMessages] = useState<string[]>([])

  const { currentChord, setCurrentChord, updateScore, addSessionResult } = usePracticeStore()
  const { fretboard, isCalibrated } = useCalibrationStore()

  useEffect(() => {
    if (typeof window !== 'undefined' && !isCalibrated) {
      // Redirect to calibration if not calibrated
      router.replace('/calibrate')
    }
  }, [isCalibrated, router])

  useEffect(() => {
    if (!videoRef.current || !stream) return

    const video = videoRef.current
    const updateDimensions = () => {
      setVideoDimensions({
        width: video.videoWidth || 640,
        height: video.videoHeight || 480,
      })
    }

    video.addEventListener('loadedmetadata', updateDimensions)
    updateDimensions()

    // Initialize frame processor
    const processor = new FrameProcessor()
    processorRef.current = processor

    // Set callbacks to get current chord and handedness from stores
    processor.setCallbacks({
      getChordTarget: () => currentChord,
      getHandedness: () => handedness,
    })

    let chordStartTime: number | null = null
    let lastChordTarget: string | null = null

    processor.initialize().then(() => {
      processor.start(video, (state) => {
        setFrameState(state)

        // Track when chord changes
        if (state.chordTarget && state.chordTarget !== lastChordTarget) {
          chordStartTime = Date.now()
          lastChordTarget = state.chordTarget
          processor.setChordTarget(state.chordTarget)
        }

        if (state.chordMatch) {
          updateScore(state.chordMatch.score, state.chordMatch.stabilityMs)

          if (state.chordTarget) {
            const messages = generateFeedback(state.chordMatch, state.chordTarget)
            setFeedbackMessages(messages)

            // Check if chord is stable
            if (
              state.chordMatch.stabilityMs >= 2000 &&
              chordStartTime &&
              lastChordTarget === state.chordTarget
            ) {
              const timeToForm = Date.now() - chordStartTime
              addSessionResult({
                chord: state.chordTarget,
                score: state.chordMatch.score,
                timeToForm,
                mistakes: Object.values(state.chordMatch.perString)
                  .filter((s) => !s.ok)
                  .map((s) => s.reason || 'Unknown mistake'),
                timestamp: Date.now(),
              })
              chordStartTime = null // Reset to prevent duplicate entries
              lastChordTarget = null
            }
          }
        }
      })
    }).catch((error) => {
      console.error('Failed to initialize frame processor:', error)
    })

    return () => {
      if (processorRef.current) {
        processorRef.current.dispose()
        processorRef.current = null
      }
    }
  }, [stream, currentChord, updateScore, addSessionResult, handedness])

  const handleStreamReady = (newStream: MediaStream) => {
    setStream(newStream)
    if (videoRef.current) {
      videoRef.current.srcObject = newStream
    }
  }

  const fingerAssignments: FingerAssignment[] = frameState?.fingerAssignments || []

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Chord Practice</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video and overlays */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <div className="w-full h-full">
                <CameraPreview
                  onStreamReady={handleStreamReady}
                  className="w-full h-full"
                  mirrored={true}
                />
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] opacity-0 pointer-events-none"
              />
              <OverlayCanvas
                fretboard={fretboard}
                videoWidth={videoDimensions.width}
                videoHeight={videoDimensions.height}
              />
              {currentChord && (
                <ChordOverlay
                  chordName={currentChord}
                  matchResult={frameState?.chordMatch || null}
                  fingerAssignments={fingerAssignments}
                  videoWidth={videoDimensions.width}
                  videoHeight={videoDimensions.height}
                />
              )}
            </div>

            {/* Chord selector */}
            <div className="mt-4 bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Select a Chord</h2>
              <ChordSelector
                selectedChord={currentChord}
                onSelectChord={setCurrentChord}
              />
            </div>
          </div>

          {/* Feedback panel */}
          <div className="lg:col-span-1">
            <FeedbackPanel
              matchResult={frameState?.chordMatch || null}
              messages={feedbackMessages}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
