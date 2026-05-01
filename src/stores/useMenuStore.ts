import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MenuItem } from '@/types'

export const useMenuStore = defineStore('menu', () => {
  const menuOptions = ref<MenuItem[]>([
    { id: 'chicken', label: 'Chicken', emoji: '🍗', price: 0 },
    { id: 'fish', label: 'Fish', emoji: '🐟', price: 0 },
    { id: 'vegan', label: 'Vegan', emoji: '🥦', price: 0 },
  ])

  function addOption(label: string, emoji: string, price = 0) {
    menuOptions.value.push({ id: crypto.randomUUID(), label, emoji, price })
  }

  function removeOption(id: string) {
    menuOptions.value = menuOptions.value.filter((o) => o.id !== id)
  }

  function updateOption(id: string, updates: Partial<MenuItem>) {
    const opt = menuOptions.value.find(o => o.id === id)
    if (opt) {
      if (updates.label !== undefined) opt.label = updates.label
      if (updates.emoji !== undefined) opt.emoji = updates.emoji
      if (updates.price !== undefined) opt.price = updates.price
    }
  }

  function bulkReplace(newOptions: MenuItem[]) {
    menuOptions.value = newOptions.map((opt) => ({
      ...opt,
      price: typeof opt.price === 'number' ? opt.price : 0,
    }))
  }

  return { menuOptions, addOption, removeOption, updateOption, bulkReplace }
}, { persist: true })
