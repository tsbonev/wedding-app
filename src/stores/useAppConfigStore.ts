import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppConfigStore = defineStore('config', () => {
  const coupleName = ref('')
  const weddingDate = ref<string | null>(null)
  const venue = ref('')

  return { coupleName, weddingDate, venue }
}, { persist: true })
