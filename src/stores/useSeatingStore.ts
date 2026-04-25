import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Table, TableShape } from '@/types'
import { useGuestStore } from './useGuestStore'

export const useSeatingStore = defineStore('seating', () => {
  const tables = ref<Table[]>([])

  const getById = (id: string) => tables.value.find((t) => t.id === id)

  function addTable(payload: { name: string; shape: TableShape; capacity: number }) {
    const seats = Array.from({ length: payload.capacity }, (_, i) => ({ index: i, guestId: null as string | null }))
    tables.value.push({
      id: crypto.randomUUID(),
      ...payload,
      seats,
      posX: 50 + tables.value.length * 20,
      posY: 50 + tables.value.length * 20,
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

  function bulkReplace(list: Table[]) {
    tables.value = list
  }

  return { tables, getById, addTable, updateTable, deleteTable, assignGuest, unassignGuest, bulkReplace }
}, { persist: true })
