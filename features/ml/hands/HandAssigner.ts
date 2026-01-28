// Assign hands to fretting vs strumming roles

import type { Hand, FretboardState } from '@/lib/types'

export interface HandAssignment {
  fretting: Hand | null
  strumming: Hand | null
}

/**
 * Calculate how many keypoints are inside the fretboard ROI
 */
function keypointsInROI(
  hand: Hand,
  roi: FretboardState['roi']
): number {
  if (!roi || !hand.keypoints) {
    return 0
  }

  return hand.keypoints.filter((kp) => {
    if (!kp) return false
    return (
      kp.x >= roi.x &&
      kp.x <= roi.x + roi.width &&
      kp.y >= roi.y &&
      kp.y <= roi.y + roi.height
    )
  }).length
}

/**
 * Calculate distance from hand center to fretboard ROI
 */
function distanceToROI(
  hand: Hand,
  roi: FretboardState['roi']
): number {
  if (!roi || !hand.keypoints || hand.keypoints.length === 0) {
    return Infinity
  }

  // Calculate hand center (wrist is typically keypoint 0)
  const center = hand.keypoints[0] || { x: 0.5, y: 0.5 }
  const roiCenter = {
    x: roi.x + roi.width / 2,
    y: roi.y + roi.height / 2,
  }

  const dx = center.x - roiCenter.x
  const dy = center.y - roiCenter.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Assign hands to fretting vs strumming roles
 */
export function assignHands(
  hands: Hand[],
  fretboard: FretboardState,
  handedness: 'right' | 'left' = 'right'
): HandAssignment {
  if (hands.length === 0) {
    return { fretting: null, strumming: null }
  }

  if (hands.length === 1) {
    // Single hand: determine role based on position
    const hand = hands[0]
    const inROI = keypointsInROI(hand, fretboard.roi)

    if (inROI > 10) {
      // Most keypoints in fretboard ROI = fretting hand
      return { fretting: hand, strumming: null }
    } else {
      // Outside ROI = strumming hand
      return { fretting: null, strumming: hand }
    }
  }

  // Two hands: assign based on position relative to fretboard
  const hand1 = hands[0]
  const hand2 = hands[1]

  const hand1InROI = keypointsInROI(hand1, fretboard.roi)
  const hand2InROI = keypointsInROI(hand2, fretboard.roi)

  // Hand with more keypoints in ROI is fretting hand
  if (hand1InROI > hand2InROI) {
    return { fretting: hand1, strumming: hand2 }
  } else if (hand2InROI > hand1InROI) {
    return { fretting: hand2, strumming: hand1 }
  }

  // If similar, use distance to ROI
  const hand1Dist = distanceToROI(hand1, fretboard.roi)
  const hand2Dist = distanceToROI(hand2, fretboard.roi)

  if (hand1Dist < hand2Dist) {
    return { fretting: hand1, strumming: hand2 }
  } else {
    return { fretting: hand2, strumming: hand1 }
  }
}

/**
 * Get fingertips from a hand (indices: thumb=4, index=8, middle=12, ring=16, pinky=20)
 */
export function getFingertips(hand: Hand): Array<{
  fingerId: number
  position: { x: number; y: number; z?: number }
}> {
  const fingertipIndices = [4, 8, 12, 16, 20] // Thumb, Index, Middle, Ring, Pinky
  return fingertipIndices.map((idx, fingerId) => ({
    fingerId,
    position: hand.keypoints[idx] || { x: 0, y: 0, z: 0 },
  }))
}
