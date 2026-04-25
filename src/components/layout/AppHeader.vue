<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const config = useAppConfigStore()

const subtitle = computed(() => {
  const parts: string[] = []
  if (config.weddingDate) parts.push(new Date(config.weddingDate).toLocaleDateString())
  if (config.venue) parts.push(config.venue)
  return parts.join(' · ')
})
</script>

<template>
  <div class="app-header">
    <span class="couple-name">{{ config.coupleName || 'My Wedding' }}</span>
    <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--n-border-color);
}
.couple-name {
  font-size: 18px;
  font-weight: 600;
}
.subtitle {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
}
</style>
