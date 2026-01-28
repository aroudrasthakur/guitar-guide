// Zustand store for calibration state

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FretboardState, CalibrationProfile } from '@/lib/types'

interface CalibrationState {
  fretboard: FretboardState
  guitarType: 'acoustic' | 'electric'
  handedness: 'right' | 'left'
  isCalibrated: boolean
  setFretboard: (fretboard: FretboardState) => void
  setGuitarType: (type: 'acoustic' | 'electric') => void
  setHandedness: (handedness: 'right' | 'left') => void
  saveCalibration: (profile: CalibrationProfile) => void
  loadCalibration: () => CalibrationProfile | null
  reset: () => void
}

const defaultFretboard: FretboardState = {
  homography: null,
  strings: [],
  frets: [],
  confidence: 0,
}

export const useCalibrationStore = create<CalibrationState>()(
  persist(
    (set, get) => ({
      fretboard: defaultFretboard,
      guitarType: 'acoustic',
      handedness: 'right',
      isCalibrated: false,

      setFretboard: (fretboard) =>
        set({ fretboard, isCalibrated: fretboard.confidence > 0.7 }),

      setGuitarType: (guitarType) => set({ guitarType }),

      setHandedness: (handedness) => set({ handedness }),

      saveCalibration: (profile) => {
        const fretboard: FretboardState = {
          homography: profile.homography,
          strings: profile.strings,
          frets: profile.frets,
          confidence: 0.9, // High confidence for manual calibration
        }
        set({
          fretboard,
          guitarType: profile.guitarType,
          handedness: profile.handedness,
          isCalibrated: true,
        })

        // Also save to localStorage with device ID
        if (typeof window !== 'undefined') {
          const deviceId = getDeviceId()
          const key = `calibration_${deviceId}`
          localStorage.setItem(key, JSON.stringify(profile))
        }
      },

      loadCalibration: () => {
        if (typeof window === 'undefined') {
          return null
        }
        const deviceId = getDeviceId()
        const key = `calibration_${deviceId}`
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const profile: CalibrationProfile = JSON.parse(stored)
            const fretboard: FretboardState = {
              homography: profile.homography,
              strings: profile.strings,
              frets: profile.frets,
              confidence: 0.9,
            }
            set({
              fretboard,
              guitarType: profile.guitarType,
              handedness: profile.handedness,
              isCalibrated: true,
            })
            return profile
          } catch (error) {
            console.error('Failed to load calibration:', error)
          }
        }
        return null
      },

      reset: () =>
        set({
          fretboard: defaultFretboard,
          isCalibrated: false,
        }),
    }),
    {
      name: 'calibration-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        guitarType: state.guitarType,
        handedness: state.handedness,
        isCalibrated: state.isCalibrated,
      }),
    }
  )
)

/**
 * Get or create device ID for calibration persistence
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-device-id'
  }
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}
