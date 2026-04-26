export type RSVPStatus = 'pending' | 'confirmed' | 'declined'

export interface GuestGroup {
  id: string
  name: string
  color: string
}

export interface Guest {
  id: string
  firstName: string
  lastName: string
  rsvpStatus: RSVPStatus
  mealChoiceId: string | null
  dietaryNotes: string
  partnerId: string | null
  parentId: string | null
  isChild: boolean
  isGroom: boolean
  isBride: boolean
  customEmoji: string | null
  groupId: string | null
  notes: string
  tableId: string | null
  roomId: string | null
  isChildrenSeatAdjoining?: boolean
  createdAt: string
}

export type TableShape = 'round' | 'rectangular'

export interface Seat {
  index: number
  guestId: string | null
}

export type SeatOriginCorner = 'tl' | 'tr' | 'bl' | 'br'

export interface Table {
  id: string
  name: string
  shape: TableShape
  capacity: number
  widthCm: number | null
  lengthCm: number | null
  seats: Seat[]
  posX: number
  posY: number
  aerialPosX: number
  aerialPosY: number
  rotation: number
  seatOriginCorner: SeatOriginCorner | null
  oneSided?: boolean
}

export interface Room {
  id: string
  number: string
  type: string
  capacity: number
  guestIds: string[]
  checkIn: string | null
  checkOut: string | null
  isCustomTimes?: boolean
  notes: string
}

export interface MenuItem {
  id: string
  label: string
  emoji: string
}

export interface AppConfig {
  coupleName: string
  weddingDate: string | null
  venue: string
  guestSidebarWidth?: number
}

export interface WeddingSnapshot {
  version: number
  exportedAt: string
  config: AppConfig
  guests: Guest[]
  tables: Table[]
  rooms: Room[]
  menuOptions: MenuItem[]
  groups: GuestGroup[]
}
