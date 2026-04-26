<script setup lang="ts">
import { watch, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NGlobalStyle, NDialogProvider, NMessageProvider, enUS, darkTheme } from 'naive-ui'
import { bgBG } from '@/locales/bgBG'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useI18nStore } from '@/stores/useI18nStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const i18n = useI18nStore()
const configStore = useAppConfigStore()
const route = useRoute()

const naiveLocale = computed(() => i18n.locale === 'en' ? enUS : bgBG)
const naiveTheme = computed(() => configStore.isDarkMode ? darkTheme : null)
const naiveDateLocale = computed(() => null)

watchEffect(() => {
  document.documentElement.classList.toggle('dark', configStore.isDarkMode)
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
</script>

<template>
  <n-config-provider :locale="naiveLocale" :date-locale="naiveDateLocale" :theme="naiveTheme">
    <n-dialog-provider>
      <n-message-provider>
        <n-global-style />
        <AppLayout />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
