<script setup lang="ts">
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NGlobalStyle, NDialogProvider, NMessageProvider, enUS } from 'naive-ui'
import { bgBG } from '@/locales/bgBG'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useI18nStore } from '@/stores/useI18nStore'

const i18n = useI18nStore()
const route = useRoute()

const naiveLocale = computed(() => {
  return i18n.locale === 'en' ? enUS : bgBG
})

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/guests': 'guests',
  '/seating': 'seating',
  '/meals': 'meals',
  '/rooms': 'rooms',
  '/settings': 'settings',
  '/export': 'export_import'
}

watch(
  () => [i18n.locale, route.path],
  () => {
    const pageKey = routeTitleMap[route.path]
    const appTitle = i18n.t('app_title')
    if (pageKey) {
      document.title = `${i18n.t(pageKey)} | ${appTitle}`
    } else if (route.path.startsWith('/guests/')) {
      document.title = `${i18n.t('guests')} | ${appTitle}`
    } else if (route.path.startsWith('/rooms/')) {
      document.title = `${i18n.t('rooms')} | ${appTitle}`
    } else {
      document.title = appTitle
    }
  },
  { immediate: true }
)
const naiveDateLocale = computed(() => {
  // Naive UI doesn't seem to have a bgBG date locale out of the box in some versions,
  // but let's check what's available. Usually it's dateEnUS.
  return null // Use default for now, or we could import dateEnUS
})
</script>

<template>
  <n-config-provider :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-dialog-provider>
      <n-message-provider>
        <n-global-style />
        <AppLayout />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
