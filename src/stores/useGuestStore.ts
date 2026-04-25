import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Guest } from '@/types'

export const useGuestStore = defineStore('guests', () => {
  const guests = ref<Guest[]>([])

  const getById = (id: string) => guests.value.find((g) => g.id === id)
  const confirmedGuests = computed(() => guests.value.filter((g) => g.rsvpStatus === 'confirmed'))
  const unassignedGuests = computed(() => guests.value.filter((g) => g.tableId === null && g.rsvpStatus !== 'declined'))
  const unassignedRoomGuests = computed(() => guests.value.filter((g) => g.roomId === null && g.rsvpStatus !== 'declined'))

  function addGuest(payload: Omit<Guest, 'id' | 'createdAt'>) {
    guests.value.push({ ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
  }

  function updateGuest(id: string, patch: Partial<Guest>) {
    const idx = guests.value.findIndex((g) => g.id === id)
    if (idx !== -1) {
      const oldGuest = guests.value[idx]
      const newPartnerId = patch.partnerId

      // Handle partnership rework
      if (patch.hasOwnProperty('partnerId') && newPartnerId !== oldGuest.partnerId) {
        // 1. Clear old partner's reference to this guest
        if (oldGuest.partnerId) {
          const oldPartner = guests.value.find(g => g.id === oldGuest.partnerId)
          if (oldPartner && oldPartner.partnerId === id) {
            oldPartner.partnerId = null
          }
        }

        // 2. Clear new partner's old partnership
        if (newPartnerId) {
          const newPartner = guests.value.find(g => g.id === newPartnerId)
          if (newPartner) {
            if (newPartner.partnerId && newPartner.partnerId !== id) {
              const previousPartnerOfNewPartner = guests.value.find(g => g.id === newPartner.partnerId)
              if (previousPartnerOfNewPartner) {
                previousPartnerOfNewPartner.partnerId = null
              }
            }
            newPartner.partnerId = id
          }
        }
      }

      guests.value[idx] = { ...guests.value[idx], ...patch }
    }
  }

  function deleteGuest(id: string) {
    const guestToDelete = guests.value.find(g => g.id === id)
    if (guestToDelete?.partnerId) {
      const partner = guests.value.find(g => g.id === guestToDelete.partnerId)
      if (partner) partner.partnerId = null
    }
    guests.value = guests.value.filter((g) => g.id !== id && g.parentId !== id)
  }

  function bulkReplace(list: Guest[]) {
    guests.value = list
  }

  return { guests, getById, confirmedGuests, unassignedGuests, unassignedRoomGuests, addGuest, updateGuest, deleteGuest, bulkReplace }
}, { persist: true })
