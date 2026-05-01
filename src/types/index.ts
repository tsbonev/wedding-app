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
  price: number
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
  price?: number
}

export interface ProgrammeEvent {
  id: string
  time: string // HH:mm
  name: string
  description: string
}

export interface BudgetExpense {
  id: string
  name: string
  iconEmoji?: string | null
  type?: 'manual' | 'plates' | 'rooms'
  plannedAmount: number
  paidAmount: number
  finalAmount: number | null
  adultPlatePrice?: number
  childPlatePrice?: number
  platePricingMode?: 'adult-child' | 'meal-prices'
  linkToSeatedGuests?: boolean
  manualAdultCount?: number
  manualChildCount?: number
  roomPricingMode?: 'per-room' | 'average'
  roomsOccupancyMode?: 'all' | 'occupied'
  averageRoomPriceOverride?: number
}

export interface AppConfig {
  coupleName: string
  weddingDate: string | null
  venue: string
  currency?: 'EUR' | 'USD'
  guestSidebarWidth?: number
  showBudgetOnDashboard?: boolean
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
  programme: ProgrammeEvent[]
  budgetExpenses?: BudgetExpense[]
}
