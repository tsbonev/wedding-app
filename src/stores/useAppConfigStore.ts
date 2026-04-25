import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppConfigStore = defineStore('config', () => {
  const coupleName = ref('')
  const weddingDate = ref<string | null>(null)
  const venue = ref('')
  const guestSidebarWidth = ref(280)
  const showRelationLines = ref(true)
  const showParentalLines = ref(true)
  const showRelationLinesOnlySameTable = ref(false)
  const isLinkingMode = ref(false)
  const linkingModeType = ref<'partner' | 'child'>('partner')

  return { coupleName, weddingDate, venue, guestSidebarWidth, showRelationLines, showParentalLines, showRelationLinesOnlySameTable, isLinkingMode, linkingModeType }
}, { persist: true })
