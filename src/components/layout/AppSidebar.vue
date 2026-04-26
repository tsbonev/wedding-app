<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu, NSpace, NButton } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{
  collapsed: boolean
}>()

const route = useRoute()
const router = useRouter()
const i18n = useI18nStore()

const menuOptions = computed((): MenuOption[] => [
  { label: i18n.t('dashboard'), key: '/dashboard', icon: () => h('span', '📊') },
  { label: i18n.t('guests'), key: '/guests', icon: () => h('span', '📋') },
  { label: i18n.t('meals'), key: '/meals', icon: () => h('span', '🥂') },
  { label: i18n.t('seating'), key: '/seating', icon: () => h('span', '🪑') },
  { label: i18n.t('rooms'), key: '/rooms', icon: () => h('span', '🛌') },
  { label: i18n.t('settings'), key: '/settings', icon: () => h('span', '⚙️') },
  { label: i18n.t('export_import'), key: '/export', icon: () => h('span', '📤') },
])

const activeKey = computed(() => '/' + route.path.split('/')[1])

function handleSelect(key: string) {
  router.push(key)
}
</script>

<template>
  <div class="sidebar-container">
    <div class="menu-content">
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        :collapsed="props.collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        @update:value="handleSelect"
      />
    </div>
    <div class="language-switcher" :class="{ 'is-collapsed': props.collapsed }">
      <n-space :vertical="props.collapsed" justify="center" :size="props.collapsed ? 12 : 8">
        <n-button 
          circle 
          :size="props.collapsed ? 'medium' : 'small'" 
          @click="i18n.setLocale('en')"
          :type="i18n.locale === 'en' ? 'primary' : 'default'"
          title="English"
        >
          🇺🇸
        </n-button>
        <n-button 
          circle 
          :size="props.collapsed ? 'medium' : 'small'" 
          @click="i18n.setLocale('bg')"
          :type="i18n.locale === 'bg' ? 'primary' : 'default'"
          title="Български"
        >
          🇧🇬
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.menu-content {
  flex: 1;
}
.language-switcher {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.language-switcher.is-collapsed {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}
</style>
