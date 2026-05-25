<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu, NSpace, NButton, NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { Moon, Sun, Save } from 'lucide-vue-next'
import { useI18nStore } from '@/stores/useI18nStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCloudSync } from '@/composables/useCloudSync'

const props = defineProps<{
  collapsed: boolean
}>()

const route = useRoute()
const router = useRouter()
const i18n = useI18nStore()
const configStore = useAppConfigStore()
const authStore = useAuthStore()
const { hasUnsavedChanges, isSaving, saveSnapshot } = useCloudSync()

const menuOptions = computed((): MenuOption[] => [
  { label: i18n.t('dashboard'), key: '/dashboard', icon: () => h('span', '📊') },
  { label: i18n.t('guests'), key: '/guests', icon: () => h('span', '📋') },
  { label: i18n.t('programme'), key: '/programme', icon: () => h('span', '📅') },
  { label: i18n.t('budget'), key: '/budget', icon: () => h('span', '💸') },
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
      <div v-if="authStore.user && hasUnsavedChanges" class="unsaved-banner" :class="{ 'is-collapsed': props.collapsed }">
        <template v-if="!props.collapsed">
          <div class="banner-text">{{ i18n.t('unsaved_changes') }}</div>
          <n-button
            type="warning"
            size="small"
            secondary
            :loading="isSaving"
            @click="saveSnapshot"
            style="width: 100%; margin-top: 8px;"
          >
            <template #icon>
              <n-icon :component="Save" />
            </template>
            {{ i18n.t('save_now') }}
          </n-button>
        </template>
        <template v-else>
          <n-button
            circle
            type="warning"
            size="medium"
            :loading="isSaving"
            @click="saveSnapshot"
            :title="i18n.t('save_now')"
          >
            <template #icon>
              <n-icon :component="Save" />
            </template>
          </n-button>
        </template>
      </div>
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
        <n-button
          circle
          :size="props.collapsed ? 'medium' : 'small'"
          @click="configStore.isDarkMode = !configStore.isDarkMode"
          :title="configStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <template #icon>
            <n-icon :component="configStore.isDarkMode ? Sun : Moon" />
          </template>
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
.unsaved-banner {
  margin: 16px;
  padding: 12px;
  background-color: rgba(240, 160, 32, 0.1);
  border: 1px solid rgba(240, 160, 32, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.unsaved-banner.is-collapsed {
  margin: 8px 0;
  padding: 8px 0;
  background-color: transparent;
  border: none;
}
.banner-text {
  font-size: 13px;
  font-weight: 500;
  color: #f0a020;
}
.language-switcher {
  padding: 16px;
  border-top: 1px solid var(--border-soft);
}
.language-switcher.is-collapsed {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}
</style>
