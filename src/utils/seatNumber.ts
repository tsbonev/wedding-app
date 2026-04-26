import type { Table, SeatOriginCorner } from '@/types'

export const SEAT_TOKEN_SIZE = 40
export const SEAT_GAP = 8
export const SEAT_ROW_PADDING = 24
export const RECT_BODY_HEIGHT = 64
export const ROUND_RADIUS_BASE = 30
export const ROUND_RADIUS_PER_SEAT = 10
export const ROUND_RADIUS_MIN = 60

export function getDisplaySeatNumber(table: Table, seatIndex: number): number {
  if (!table.seatOriginCorner) return seatIndex + 1
  const n = table.seats.length
  const half = Math.ceil(n / 2)
  const corner: SeatOriginCorner = table.seatOriginCorner
  const i = seatIndex

  if (table.shape === 'rectangular') {
    if (table.oneSided) {
      return (corner === 'tl' || corner === 'bl') ? i + 1 : n - i
    }
    let di: number
    if (corner === 'tl') di = i
    else if (corner === 'tr') di = i < half ? half - 1 - i : half + (n - 1 - i)
    else if (corner === 'bl') di = i >= half ? i - half : (n - half) + i
    else di = n - 1 - i
    return di + 1
  }

  const cornerDeg: Record<SeatOriginCorner, number> = { tl: 225, tr: 315, br: 45, bl: 135 }
  const ca = cornerDeg[corner]
  let startK = 0; let minDist = Infinity
  for (let k = 0; k < n; k++) {
    const deg = ((k / n) * 360 - 90 + 360) % 360
    let d = Math.abs(deg - ca); if (d > 180) d = 360 - d
    if (d < minDist) { minDist = d; startK = k }
  }
  return ((i - startK + n) % n) + 1
}
