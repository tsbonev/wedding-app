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
      :width="220"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      bordered
    >
      <AppHeader v-if="!collapsed" />
      <AppSidebar />
    </n-layout-sider>

    <!-- mobile drawer -->
    <n-drawer v-if="isMobile" v-model:show="drawerOpen" :width="220" placement="left">
      <n-drawer-content>
        <AppHeader />
        <AppSidebar />
      </n-drawer-content>
    </n-drawer>

    <n-layout-content content-style="padding: 24px; overflow-y: auto;">
      <n-button v-if="isMobile" quaternary @click="drawerOpen = true" style="margin-bottom:12px;">
        ☰ Menu
      </n-button>
      <RouterView />
    </n-layout-content>
  </n-layout>
</template>
