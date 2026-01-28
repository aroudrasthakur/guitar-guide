'use client'

import { useEffect, useRef, useState, forwardRef } from 'react'
import { requestCameraAccess, stopCameraStream, type CameraConstraints } from '@/lib/camera'

interface CameraPreviewProps {
  onStreamReady?: (stream: MediaStream) => void
  constraints?: CameraConstraints
  className?: string
  mirrored?: boolean
}

const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  function CameraPreview(
    {
      onStreamReady,
      constraints,
      className = '',
      mirrored = true,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const internalRef = ref || videoRef
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let currentStream: MediaStream | null = null

    const initCamera = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const newStream = await requestCameraAccess(constraints)
        currentStream = newStream

        const videoElement = internalRef && 'current' in internalRef ? internalRef.current : null
        if (videoElement && newStream) {
          videoElement.srcObject = newStream
          setStream(newStream)
          onStreamReady?.(newStream)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to access camera'
        setError(errorMessage)
        console.error('Camera initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initCamera()

    return () => {
      if (currentStream) {
        stopCameraStream(currentStream)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraints?.deviceId])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white ${className}`}
      >
        <div className="text-center p-4">
          <p className="text-red-400 mb-2">Camera Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Accessing camera...</p>
          </div>
        </div>
      )}
      <video
        ref={internalRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${
          mirrored ? 'scale-x-[-1]' : ''
        }`}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  )
  }
)

export default CameraPreview
