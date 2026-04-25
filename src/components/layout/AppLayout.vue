<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent, NDrawer, NDrawerContent, NButton } from 'naive-ui'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const collapsed = ref(false)
const drawerOpen = ref(false)

// treat <768px as mobile
const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
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

    <n-layout-content content-style="padding: 24px; overflow-y: auto;">
      <n-button v-if="isMobile" quaternary @click="drawerOpen = true" style="margin-bottom:12px;" class="no-print">
        ☰ Menu
      </n-button>
      <RouterView />
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
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
