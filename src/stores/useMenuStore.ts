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

  function updateOption(id: string, updates: Partial<MenuItem>) {
    const opt = menuOptions.value.find(o => o.id === id)
    if (opt) {
      if (updates.label !== undefined) opt.label = updates.label
      if (updates.emoji !== undefined) opt.emoji = updates.emoji
    }
  }

  function bulkReplace(newOptions: MenuItem[]) {
    menuOptions.value = newOptions
  }

  return { menuOptions, addOption, removeOption, updateOption, bulkReplace }
}, { persist: true })
