// Shared TypeScript types for the Guitar Guide app

// Hand keypoint types (MediaPipe Hands)
export interface Point2D {
  x: number
  y: number
}

export interface HandKeypoint {
  x: number
  y: number
  z?: number
}

export interface Hand {
  keypoints: HandKeypoint[]
  handedness: 'Left' | 'Right'
  score: number
}

export interface HandDetectionResult {
  hands: Hand[]
  timestamp: number
}

// Fretboard types
export interface Line {
  start: Point2D
  end: Point2D
}

export interface FretboardState {
  homography: number[][] | null // 3x3 matrix (Matrix3x3 type)
  strings: Line[]
  frets: Line[]
  confidence: number
  roi?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Finger assignment types
export interface FingerAssignment {
  fingerId: number // 1-4 (thumb=0, index=1, middle=2, ring=3, pinky=4)
  stringIdx: number // 1-6 (1=high E, 6=low E)
  fretIdx: number // 0 = open, 1+ = fretted
  confidence: number
  position: Point2D
}

// Chord matching types
export type StringConstraint = 
  | { type: 'muted' } // X
  | { type: 'open' } // 0
  | { type: 'fretted'; fret: number; finger: number } // k with finger number

export interface ChordTemplate {
  name: string
  strings: {
    [key: number]: StringConstraint // 1-6
  }
}

export interface StringMatchResult {
  ok: boolean
  reason?: string
  fingerId?: number
}

export interface ChordMatchResult {
  score: number // 0-1
  perString: { [key: number]: StringMatchResult }
  stabilityMs: number
}

// Calibration types
export interface CalibrationProfile {
  homography: number[][]
  strings: Line[]
  frets: Line[]
  guitarType: 'acoustic' | 'electric'
  handedness: 'right' | 'left'
  timestamp: number
}

// Practice session types
export interface PracticeSession {
  chordTarget: string
  score: number
  stabilityMs: number
  history: SessionResult[]
}

export interface SessionResult {
  chord: string
  score: number
  timeToForm: number
  mistakes: string[]
  timestamp: number
}

// Frame processing state
export interface FrameState {
  fretboard: FretboardState
  hands: {
    fretting: Hand | null
    strumming: Hand | null
  }
  chordTarget: string | null
  chordMatch: ChordMatchResult | null
  fingerAssignments?: FingerAssignment[]
  lastStrumTs: number
  metrics: {
    chordScore: number
    stableMs: number
  }
}
