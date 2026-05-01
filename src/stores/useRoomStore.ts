import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Room } from '@/types'
import { useGuestStore } from './useGuestStore'

export const useRoomStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([])
  const roomTypes = ref<string[]>(['suite', 'single', 'double'])
  const globalCheckIn = ref<string | null>(null)
  const globalCheckOut = ref<string | null>(null)
  const roomPricingMode = ref<'per-room' | 'average'>('per-room')
  const averageRoomPrice = ref(0)

  const sortedRooms = computed(() => {
    return [...rooms.value].sort((a, b) => {
      return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    })
  })

  const getById = (id: string) => rooms.value.find((r) => r.id === id)

  function addRoom(payload: Omit<Room, 'id' | 'guestIds'>) {
    rooms.value.push({ ...payload, price: payload.price ?? 0, id: crypto.randomUUID(), guestIds: [] })
  }

  function addRoomType(type: string) {
    if (type && !roomTypes.value.includes(type)) {
      roomTypes.value.push(type)
    }
  }

  function removeRoomType(type: string) {
    const defaultTypes = ['suite', 'single', 'double']
    const isDefault = defaultTypes.includes(type)
    const customTypes = roomTypes.value.filter(t => !defaultTypes.includes(t))

    // Default types can only be deleted if there's at least one custom type
    if (isDefault && customTypes.length === 0) {
      return
    }

    roomTypes.value = roomTypes.value.filter(t => t !== type)
  }

  function updateRoomType(oldType: string, newType: string) {
    const idx = roomTypes.value.indexOf(oldType)
    if (idx !== -1 && newType && !roomTypes.value.includes(newType)) {
      roomTypes.value[idx] = newType
      // Update all rooms that use the old type
      rooms.value.forEach(r => {
        if (r.type === oldType) r.type = newType
      })
    }
  }

  function updateRoom(id: string, patch: Partial<Room>) {
    const idx = rooms.value.findIndex((r) => r.id === id)
    if (idx !== -1) rooms.value[idx] = { ...rooms.value[idx], ...patch }
  }

  function deleteRoom(id: string) {
    const room = rooms.value.find((r) => r.id === id)
    if (room) {
      const guestStore = useGuestStore()
      room.guestIds.forEach((gid) => guestStore.updateGuest(gid, { roomId: null }))
    }
    rooms.value = rooms.value.filter((r) => r.id !== id)
  }

  function assignGuests(roomId: string, guestIds: string[]) {
    const guestStore = useGuestStore()
    const room = rooms.value.find((r) => r.id === roomId)
    if (!room) return
    for (const gid of guestIds) {
      for (const r of rooms.value) {
        if (r.id !== roomId) r.guestIds = r.guestIds.filter((id) => id !== gid)
      }
      guestStore.updateGuest(gid, { roomId })
    }
    room.guestIds = [...new Set([...room.guestIds, ...guestIds])]
  }

  function unassignGuest(guestId: string) {
    const guestStore = useGuestStore()
    for (const room of rooms.value) {
      const idx = room.guestIds.indexOf(guestId)
      if (idx !== -1) { room.guestIds.splice(idx, 1); break }
    }
    guestStore.updateGuest(guestId, { roomId: null })
  }

  function bulkReplace(list: Room[]) {
    rooms.value = list.map((room) => ({
      ...room,
      price: typeof room.price === 'number' ? room.price : 0,
    }))
  }

  function updateGlobalTimes(checkIn: string | null, checkOut: string | null) {
    globalCheckIn.value = checkIn
    globalCheckOut.value = checkOut
    // Trigger persistence by updating a top-level ref
    rooms.value = [...rooms.value]
  }

  function setRoomPricingMode(mode: 'per-room' | 'average') {
    roomPricingMode.value = mode
  }

  function setAverageRoomPrice(price: number) {
    averageRoomPrice.value = Number.isFinite(price) ? Math.max(0, Math.round(price * 100) / 100) : 0
  }

  return {
    rooms,
    sortedRooms,
    roomTypes,
    globalCheckIn,
    globalCheckOut,
    roomPricingMode,
    averageRoomPrice,
    getById,
    addRoom,
    addRoomType,
    removeRoomType,
    updateRoomType,
    updateRoom,
    deleteRoom,
    assignGuests,
    unassignGuest,
    bulkReplace,
    updateGlobalTimes,
    setRoomPricingMode,
    setAverageRoomPrice,
  }
}, { persist: true })
