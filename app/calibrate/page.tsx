'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CameraPreview from '@/components/CameraPreview'
import ManualCalibration from '@/features/calibration/ManualCalibration'
import OverlayCanvas from '@/components/OverlayCanvas'
import { useCalibrationStore } from '@/features/calibration/CalibrationStore'
import { estimateFretboard } from '@/features/ml/fretboard/FretboardLocalizer'
import { getDownsampledFrame } from '@/lib/camera'

export default function CalibratePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [showManualCalibration, setShowManualCalibration] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const { fretboard, setFretboard, isCalibrated } = useCalibrationStore()

  useEffect(() => {
    // Try to load saved calibration
    if (typeof window !== 'undefined') {
      const saved = useCalibrationStore.getState().loadCalibration()
      if (saved) {
        router.push('/practice/chords')
      }
    }
  }, [router])

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

    // Try auto-detection
    const tryAutoDetect = async () => {
      if (!videoRef.current || video.readyState < 2) return // Need at least HAVE_CURRENT_DATA

      try {
        const imageData = getDownsampledFrame(videoRef.current, 640, 360)
        if (!imageData) return

        const result = estimateFretboard(imageData)
        setFretboard(result)

        if (result.confidence >= 0.7) {
          // Auto-detection successful - save and redirect
          setFretboard(result)
          setTimeout(() => {
            router.push('/practice/chords')
          }, 2000)
        }
      } catch (error) {
        console.error('Auto-detection error:', error)
      }
    }

    const interval = setInterval(tryAutoDetect, 2000)
    // Initial attempt after a short delay
    const timeout = setTimeout(tryAutoDetect, 500)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      video.removeEventListener('loadedmetadata', updateDimensions)
    }
  }, [stream, setFretboard, router])

  const handleStreamReady = (newStream: MediaStream) => {
    setStream(newStream)
    if (videoRef.current) {
      videoRef.current.srcObject = newStream
    }
  }

  const handleCalibrationComplete = () => {
    router.push('/practice/chords')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Calibrate Your Guitar
        </h1>

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

          {showManualCalibration ? (
            <ManualCalibration
              videoWidth={videoDimensions.width}
              videoHeight={videoDimensions.height}
              onComplete={handleCalibrationComplete}
            />
          ) : (
            <>
              <OverlayCanvas
                fretboard={fretboard}
                videoWidth={videoDimensions.width}
                videoHeight={videoDimensions.height}
              />

              {fretboard.confidence > 0 && fretboard.confidence < 0.7 && (
                <div className="absolute top-4 left-4 right-4 bg-yellow-600 text-white p-4 rounded-lg">
                  <p className="font-medium mb-2">Low detection confidence</p>
                  <p className="text-sm">
                    Try: Move closer, improve lighting, or use manual calibration
                  </p>
                  <button
                    onClick={() => setShowManualCalibration(true)}
                    className="mt-2 px-4 py-2 bg-white text-yellow-600 rounded hover:bg-gray-100"
                  >
                    Use Manual Calibration
                  </button>
                </div>
              )}

              {fretboard.confidence >= 0.7 && (
                <div className="absolute top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg">
                  <p className="font-medium">Calibration successful!</p>
                  <p className="text-sm">Redirecting to practice...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-center text-white">
          <p className="text-sm mb-2">
            {showManualCalibration
              ? 'Tap the points on your fretboard as instructed'
              : 'Position your guitar so the fretboard is clearly visible'}
          </p>
        </div>
      </div>
    </main>
  )
}
