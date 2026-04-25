import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MenuItem } from '@/types'

export const useMenuStore = defineStore('menu', () => {
  const menuOptions = ref<MenuItem[]>([
    { id: 'chicken', label: 'Chicken', emoji: '🍗' },
    { id: 'fish', label: 'Fish', emoji: '🐟' },
    { id: 'vegan', label: 'Vegan', emoji: '🥦' },
  ])

  function addOption(label: string, emoji: string) {
    menuOptions.value.push({ id: crypto.randomUUID(), label, emoji })
  }

  function removeOption(id: string) {
    menuOptions.value = menuOptions.value.filter((o) => o.id !== id)
  }

  function bulkReplace(options: MenuItem[]) {
    menuOptions.value = options
  }

  return { menuOptions, addOption, removeOption, bulkReplace }
}, { persist: true })
