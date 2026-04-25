import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppConfigStore = defineStore('config', () => {
  const coupleName = ref('')
  const weddingDate = ref<string | null>(null)
  const venue = ref('')
  const guestSidebarWidth = ref(280)
  const showPlusOneLines = ref(true)
  const showPlusOneLinesOnlySameTable = ref(false)
  const isLinkingMode = ref(false)

  return { coupleName, weddingDate, venue, guestSidebarWidth, showPlusOneLines, showPlusOneLinesOnlySameTable, isLinkingMode }
}, { persist: true })
