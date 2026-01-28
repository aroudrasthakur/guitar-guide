// Camera access wrapper for getUserMedia

export interface CameraConstraints {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  deviceId?: string
}

export interface CameraDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

/**
 * Get available camera devices
 */
export async function getCameraDevices(): Promise<CameraDevice[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        kind: device.kind,
      }))
  } catch (error) {
    console.error('Error enumerating camera devices:', error)
    return []
  }
}

/**
 * Request camera access with constraints
 */
export async function requestCameraAccess(
  constraints?: CameraConstraints
): Promise<MediaStream | null> {
  try {
    const videoConstraints: MediaTrackConstraints = {
      width: constraints?.width || { ideal: 1280 },
      height: constraints?.height || { ideal: 720 },
      facingMode: constraints?.facingMode || 'environment',
    }

    if (constraints?.deviceId) {
      videoConstraints.deviceId = { exact: constraints.deviceId }
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    })

    return stream
  } catch (error) {
    console.error('Error accessing camera:', error)
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found')
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use')
      }
    }
    throw error
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

/**
 * Get downsampled frame from video element
 */
export function getDownsampledFrame(
  video: HTMLVideoElement,
  targetWidth: number,
  targetHeight: number
): ImageData | null {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
  return ctx.getImageData(0, 0, targetWidth, targetHeight)
}

/**
 * Convert ImageData to ImageBitmap for MediaPipe
 */
export async function imageDataToImageBitmap(
  imageData: ImageData | null
): Promise<ImageBitmap> {
  if (!imageData || imageData.width === 0 || imageData.height === 0) {
    throw new Error('Invalid image data')
  }

  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }
  ctx.putImageData(imageData, 0, 0)
  return await createImageBitmap(canvas)
}
