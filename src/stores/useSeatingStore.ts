import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Table, TableShape, SeatOriginCorner } from '@/types'
import { useGuestStore } from './useGuestStore'

export const useSeatingStore = defineStore('seating', () => {
  const tables = ref<Table[]>([])

  const getById = (id: string) => tables.value.find((t) => t.id === id)

  function addTable(payload: { name: string; shape: TableShape; capacity: number; widthCm?: number | null; lengthCm?: number | null }) {
    const seats = Array.from({ length: payload.capacity }, (_, i) => ({ index: i, guestId: null as string | null }))
    tables.value.push({
      id: crypto.randomUUID(),
      name: payload.name,
      shape: payload.shape,
      capacity: payload.capacity,
      widthCm: payload.widthCm ?? null,
      lengthCm: payload.lengthCm ?? null,
      seats,
      posX: 50 + tables.value.length * 20,
      posY: 50 + tables.value.length * 20,
      aerialPosX: 50 + tables.value.length * 20,
      aerialPosY: 50 + tables.value.length * 20,
      rotation: 0,
      seatOriginCorner: null,
    })
  }

  function updateTable(id: string, patch: Partial<Table>) {
    const idx = tables.value.findIndex((t) => t.id === id)
    if (idx !== -1) tables.value[idx] = { ...tables.value[idx], ...patch }
  }

  function deleteTable(id: string) {
    const table = tables.value.find((t) => t.id === id)
    if (table) {
      const guestStore = useGuestStore()
      table.seats.forEach((s) => { if (s.guestId) guestStore.updateGuest(s.guestId, { tableId: null }) })
    }
    tables.value = tables.value.filter((t) => t.id !== id)
  }

  function assignGuest(tableId: string, seatIndex: number, guestId: string) {
    const guestStore = useGuestStore()
    unassignGuest(guestId)
    const table = tables.value.find((t) => t.id === tableId)
    if (!table) return
    const seat = table.seats.find((s) => s.index === seatIndex)
    if (!seat) return
    if (seat.guestId) guestStore.updateGuest(seat.guestId, { tableId: null })
    seat.guestId = guestId
    guestStore.updateGuest(guestId, { tableId })
  }

  function unassignGuest(guestId: string) {
    const guestStore = useGuestStore()
    for (const table of tables.value) {
      const seat = table.seats.find((s) => s.guestId === guestId)
      if (seat) { seat.guestId = null; break }
    }
    guestStore.updateGuest(guestId, { tableId: null })
  }

  function swapSeats(fromTableId: string, fromSeatIndex: number, toTableId: string, toSeatIndex: number) {
    if (fromTableId === toTableId && fromSeatIndex === toSeatIndex) return
    const guestStore = useGuestStore()
    const fromTable = tables.value.find((t) => t.id === fromTableId)
    const toTable = tables.value.find((t) => t.id === toTableId)
    if (!fromTable || !toTable) return
    const fromSeat = fromTable.seats.find((s) => s.index === fromSeatIndex)
    const toSeat = toTable.seats.find((s) => s.index === toSeatIndex)
    if (!fromSeat || !toSeat) return
    const fromGuestId = fromSeat.guestId
    const toGuestId = toSeat.guestId
    fromSeat.guestId = toGuestId
    toSeat.guestId = fromGuestId
    if (fromGuestId) guestStore.updateGuest(fromGuestId, { tableId: toTableId })
    if (toGuestId) guestStore.updateGuest(toGuestId, { tableId: fromTableId })
  }

  function resizeTable(id: string, newCapacity: number) {
    const table = tables.value.find(t => t.id === id)
    if (!table || newCapacity < 1) return
    const guestStore = useGuestStore()
    const current = table.seats.length
    if (newCapacity > current) {
      for (let i = current; i < newCapacity; i++) table.seats.push({ index: i, guestId: null })
    } else {
      // Compact: shift all occupied guests to the front, only unassign overflow
      const occupiedIds = table.seats.filter(s => s.guestId !== null).map(s => s.guestId!)
      for (let i = newCapacity; i < occupiedIds.length; i++) {
        guestStore.updateGuest(occupiedIds[i], { tableId: null })
      }
      table.seats = Array.from({ length: newCapacity }, (_, i) => ({
        index: i,
        guestId: occupiedIds[i] ?? null,
      }))
    }
    table.capacity = newCapacity
  }

  function reorderSeatsFromCorner(id: string, corner: SeatOriginCorner) {
    const idx = tables.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const table = tables.value[idx]
    const n = table.seats.length
    const half = Math.ceil(n / 2)
    let newOrder: number[]

    if (table.shape === 'rectangular') {
      const top = Array.from({ length: half }, (_, i) => i)
      const bottom = Array.from({ length: n - half }, (_, i) => half + i)
      if (corner === 'tl') newOrder = [...top, ...bottom]
      else if (corner === 'tr') newOrder = [...[...top].reverse(), ...[...bottom].reverse()]
      else if (corner === 'bl') newOrder = [...bottom, ...top]
      else newOrder = [...[...bottom].reverse(), ...[...top].reverse()]
    } else {
      // round: find seat index whose angle is closest to the corner's direction
      const cornerAngles: Record<SeatOriginCorner, number> = { tl: 225, tr: 315, br: 45, bl: 135 }
      const ca = cornerAngles[corner]
      let startK = 0
      let minDist = Infinity
      for (let k = 0; k < n; k++) {
        const seatAngle = ((k / n) * 360 - 90 + 360) % 360
        let dist = Math.abs(seatAngle - ca)
        if (dist > 180) dist = 360 - dist
        if (dist < minDist) { minDist = dist; startK = k }
      }
      newOrder = Array.from({ length: n }, (_, i) => (startK + i) % n)
    }

    tables.value[idx] = {
      ...table,
      seatOriginCorner: corner,
      seats: newOrder.map((oldIdx, newIdx) => ({
        index: newIdx,
        guestId: table.seats[oldIdx].guestId,
      })),
    }
  }

  function bulkReplace(list: Table[]) {
    tables.value = list.map(t => ({
      ...t,
      rotation: t.rotation ?? 0,
      aerialPosX: t.aerialPosX ?? t.posX,
      aerialPosY: t.aerialPosY ?? t.posY,
      seatOriginCorner: t.seatOriginCorner ?? null,
    }))
  }

  return { tables, getById, addTable, updateTable, deleteTable, resizeTable, reorderSeatsFromCorner, assignGuest, unassignGuest, swapSeats, bulkReplace }
}, { persist: true })
