export type RSVPStatus = 'pending' | 'confirmed' | 'declined'

export interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  rsvpStatus: RSVPStatus
  mealChoiceId: string | null
  dietaryNotes: string
  plusOneOf: string | null
  notes: string
  tableId: string | null
  roomId: string | null
  createdAt: string
}

export type TableShape = 'round' | 'rectangular'

export interface Seat {
  index: number
  guestId: string | null
}

export interface Table {
  id: string
  name: string
  shape: TableShape
  capacity: number
  seats: Seat[]
  posX: number
  posY: number
}

export interface Room {
  id: string
  number: string
  type: string
  capacity: number
  guestIds: string[]
  checkIn: string | null
  checkOut: string | null
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
}

export interface WeddingSnapshot {
  version: number
  exportedAt: string
  config: AppConfig
  guests: Guest[]
  tables: Table[]
  rooms: Room[]
  menuOptions: MenuItem[]
}
