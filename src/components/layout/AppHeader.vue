<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const props = defineProps<{
  collapsed: boolean
}>()

const config = useAppConfigStore()

const subtitle = computed(() => {
  const parts: string[] = []
  if (config.weddingDate) parts.push(new Date(config.weddingDate).toLocaleDateString())
  if (config.venue) parts.push(config.venue)
  return parts.join(' · ')
})
</script>

<template>
  <div class="app-header" :class="{ 'is-collapsed': props.collapsed }">
    <template v-if="!props.collapsed">
      <span class="couple-name">{{ config.coupleName || 'My Wedding' }}</span>
      <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
    </template>
    <template v-else>
      <span class="collapsed-icon">💍</span>
    </template>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--n-border-color);
  min-height: 80px;
  justify-content: center;
  transition: padding 0.3s;
}
.app-header.is-collapsed {
  padding: 20px 0;
  align-items: center;
}
.couple-name {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.subtitle {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.collapsed-icon {
  font-size: 24px;
}
</style>
