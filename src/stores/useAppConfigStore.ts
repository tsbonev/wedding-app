import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Table } from '@/types'
import { SEAT_TOKEN_SIZE, SEAT_GAP, SEAT_ROW_PADDING, RECT_BODY_HEIGHT, ROUND_RADIUS_BASE, ROUND_RADIUS_PER_SEAT, ROUND_RADIUS_MIN } from '@/utils/seatNumber'

export const useAppConfigStore = defineStore('config', () => {
  const coupleName = ref('')
  const weddingDate = ref<string | null>(null)
  const venue = ref('')
  const guestSidebarWidth = ref(280)
  const isGuestSidebarOpen = ref(true)
  const seatingActiveTab = ref<'tables' | 'floorplan'>('tables')
  const showRelationLines = ref(true)
  const showParentalLines = ref(true)
  const showRelationLinesOnlySameTable = ref(false)
  const isLinkingMode = ref(false)
  const linkingModeType = ref<'partner' | 'child'>('partner')
  const activeLinkingSource = ref<string | null>(null)
  const mousePosX = ref(0)
  const mousePosY = ref(0)

  const canvasWidth = ref(1200)
  const canvasHeight = ref(1000)
  const zoomLevel = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const isDarkMode = ref(false)

  function fitCanvasToTables(tables: Table[]) {
    if (tables.length === 0) {
      canvasWidth.value = 1200
      canvasHeight.value = 1000
      return
    }

    let maxR = 0
    let maxB = 0

    tables.forEach(table => {
      // Approximate table dimensions in the floor plan
      let w = 0
      let h = 0

      if (table.shape === 'rectangular') {
        const topCount = table.oneSided ? table.seats.length : Math.ceil(table.seats.length / 2)
        w = topCount * SEAT_TOKEN_SIZE + (topCount - 1) * SEAT_GAP + SEAT_ROW_PADDING
        h = RECT_BODY_HEIGHT
      } else {
        const radius = Math.max(ROUND_RADIUS_MIN, table.seats.length * ROUND_RADIUS_PER_SEAT)
        w = 2 * (radius + ROUND_RADIUS_BASE)
        h = w
      }

      // Handle rotation for bounding box
      const rad = (table.rotation * Math.PI) / 180
      const absCos = Math.abs(Math.cos(rad))
      const absSin = Math.abs(Math.sin(rad))
      
      const rotatedW = w * absCos + h * absSin
      const rotatedH = w * absSin + h * absCos

      const r = table.aerialPosX + rotatedW
      const b = table.aerialPosY + rotatedH

      if (r > maxR) maxR = r
      if (b > maxB) maxB = b
    })

    canvasWidth.value = Math.max(1200, Math.ceil(maxR + 200))
    canvasHeight.value = Math.max(1000, Math.ceil(maxB + 200))
  }

  return {
    coupleName,
    weddingDate,
    venue,
    guestSidebarWidth,
    isGuestSidebarOpen,
    seatingActiveTab,
    showRelationLines,
    showParentalLines,
    showRelationLinesOnlySameTable,
    isLinkingMode,
    linkingModeType,
    activeLinkingSource,
    mousePosX,
    mousePosY,
    canvasWidth,
    canvasHeight,
    zoomLevel,
    panX,
    panY,
    isDarkMode,
    fitCanvasToTables
  }
}, { persist: true })
