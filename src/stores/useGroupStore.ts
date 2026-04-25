import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { GuestGroup } from '@/types'

const DEFAULT_GROUPS: GuestGroup[] = [
  { id: 'family-groom', name: "Family of the Groom", color: '#3b82f6' },
  { id: 'family-bride', name: "Family of the Bride", color: '#ec4899' },
  { id: 'friends-groom', name: "Friends of the Groom", color: '#06b6d4' },
  { id: 'friends-bride', name: "Friends of the Bride", color: '#f97316' },
]

export const useGroupStore = defineStore('groups', () => {
  const groups = ref<GuestGroup[]>([...DEFAULT_GROUPS])

  const getById = (id: string) => groups.value.find((g) => g.id === id)

  function addGroup(name: string, color: string) {
    groups.value.push({ id: crypto.randomUUID(), name, color })
  }

  function updateGroup(id: string, patch: Partial<GuestGroup>) {
    const idx = groups.value.findIndex((g) => g.id === id)
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], ...patch }
  }

  function deleteGroup(id: string) {
    groups.value = groups.value.filter((g) => g.id !== id)
  }

  function bulkReplace(list: GuestGroup[]) {
    groups.value = list
  }

  return { groups, getById, addGroup, updateGroup, deleteGroup, bulkReplace }
}, { persist: true })
