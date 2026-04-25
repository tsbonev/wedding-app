import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Guest } from '@/types'

export const useGuestStore = defineStore('guests', () => {
  const guests = ref<Guest[]>([])

  const getById = (id: string) => guests.value.find((g) => g.id === id)
  const confirmedGuests = computed(() => guests.value.filter((g) => g.rsvpStatus === 'confirmed'))
  const unassignedGuests = computed(() => guests.value.filter((g) => g.tableId === null && g.rsvpStatus !== 'declined'))

  function addGuest(payload: Omit<Guest, 'id' | 'createdAt'>) {
    guests.value.push({ ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
  }

  function updateGuest(id: string, patch: Partial<Guest>) {
    const idx = guests.value.findIndex((g) => g.id === id)
    if (idx !== -1) guests.value[idx] = { ...guests.value[idx], ...patch }
  }

  function deleteGuest(id: string) {
    guests.value = guests.value.filter((g) => g.id !== id && g.plusOneOf !== id)
  }

  function bulkReplace(list: Guest[]) {
    guests.value = list
  }

  return { guests, getById, confirmedGuests, unassignedGuests, addGuest, updateGuest, deleteGuest, bulkReplace }
}, { persist: true })
