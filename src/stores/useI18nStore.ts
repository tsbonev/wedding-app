import { defineStore } from 'pinia'
import { ref } from 'vue'
import { en } from '@/locales/en'
import { bg } from '@/locales/bg'

export type Locale = 'en' | 'bg'

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref<Locale>('en')

  const translations: Record<Locale, Record<string, string>> = { en, bg }

  const t = (key: string): string => {
    return translations[locale.value][key] || key
  }

  function setLocale(newLocale: Locale) {
    locale.value = newLocale
  }

  return { locale, t, setLocale }
}, { persist: true })
