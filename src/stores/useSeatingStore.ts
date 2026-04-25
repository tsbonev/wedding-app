import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Table, TableShape } from '@/types'
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
      for (let i = newCapacity; i < current; i++) {
        if (table.seats[i].guestId) guestStore.updateGuest(table.seats[i].guestId!, { tableId: null })
      }
      table.seats = table.seats.slice(0, newCapacity)
    }
    table.capacity = newCapacity
  }

  function bulkReplace(list: Table[]) {
    tables.value = list.map(t => ({
      rotation: 0,
      aerialPosX: t.aerialPosX ?? t.posX,
      aerialPosY: t.aerialPosY ?? t.posY,
      ...t
    }))
  }

  return { tables, getById, addTable, updateTable, deleteTable, resizeTable, assignGuest, unassignGuest, swapSeats, bulkReplace }
}, { persist: true })
