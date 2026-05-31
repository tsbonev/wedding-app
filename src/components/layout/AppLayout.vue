<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutContent, NLayoutHeader, NDrawer, NDrawerContent, NButton, NIcon } from 'naive-ui'
import { Menu, ArrowUp } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useI18nStore } from '@/stores/useI18nStore'

const collapsed = ref(false)
const drawerOpen = ref(false)
const route = useRoute()
const i18n = useI18nStore()
const scrollContainerRef = ref<any>(null)
const showScrollTop = ref(false)

// treat <768px as mobile
const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  showScrollTop.value = target.scrollTop > 100
}

function scrollToTop() {
  if (scrollContainerRef.value) {
    // Naive UI's n-layout-content has a scrollTo method that handles both native and custom scrollbars
    scrollContainerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/programme': 'programme',
  '/guests': 'guests',
  '/seating': 'seating',
  '/budget': 'budget',
  '/meals': 'meals',
  '/rooms': 'rooms',
  '/settings': 'settings',
  '/export': 'export_import'
}

const currentTitle = computed(() => {
  const pageKey = routeTitleMap[route.path]
  if (pageKey) return i18n.t(pageKey)
  if (route.path.startsWith('/guests/')) return i18n.t('guests')
  if (route.path.startsWith('/rooms/')) return i18n.t('rooms')
  return i18n.t('app_title')
})
</script>

<template>
  <n-layout has-sider style="height: 100vh;">
    <!-- desktop sidebar -->
    <n-layout-sider
      v-if="!isMobile"
      :collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="64"
      :width="280"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      bordered
      content-style="display: flex; flex-direction: column; height: 100vh;"
    >
      <AppHeader :collapsed="collapsed" />
      <AppSidebar :collapsed="collapsed" />
    </n-layout-sider>

    <!-- mobile drawer -->
    <n-drawer v-if="isMobile" v-model:show="drawerOpen" :width="280" placement="left">
      <n-drawer-content body-content-style="padding: 0; display: flex; flex-direction: column; height: 100%;">
        <AppHeader :collapsed="false" />
        <AppSidebar :collapsed="false" />
      </n-drawer-content>
    </n-drawer>

    <n-layout-content
      ref="scrollContainerRef"
      content-style="min-height: 100%; display: flex; flex-direction: column;"
      :native-scrollbar="false"
      @scroll="handleScroll"
    >
      <n-layout-header v-if="isMobile" bordered class="mobile-header no-print">
        <div class="mobile-header-left">
          <n-button quaternary @click="drawerOpen = true">
            <template #icon>
              <n-icon :component="Menu" />
            </template>
          </n-button>
          <span class="mobile-title">{{ currentTitle }}</span>
        </div>
        <n-button
          v-if="showScrollTop"
          quaternary
          @click="scrollToTop"
          class="back-to-top-btn"
        >
          <template #icon>
            <n-icon :component="ArrowUp" />
          </template>
        </n-button>
      </n-layout-header>
      <div class="page-content">
        <RouterView />
      </div>
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-surface);
  height: 56px;
  gap: 8px;
  flex-shrink: 0;
}
.mobile-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mobile-title {
  font-weight: 600;
  font-size: 16px;
}
.page-content {
  padding: 24px;
  flex: 1;
}
@media (max-width: 767px) {
  .page-content {
    padding: 16px;
  }
}
@media print {
  .n-layout-sider, 
  :deep(.n-layout-sider),
  .no-print {
    display: none !important;
  }
  .n-layout-content,
  :deep(.n-layout-content),
  :deep(.n-layout-scroll-container) {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    height: auto !important;
  }
  .n-layout,
  :deep(.n-layout) {
    height: auto !important;
    display: block !important;
  }
}
</style>
