<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>()
</script>

<template>
  <div style="text-align: center; padding: 60px 24px; color: #999;">
    <div style="font-size: 48px; margin-bottom: 16px;">{{ icon ?? '📭' }}</div>
    <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #555;">{{ title }}</div>
    <div v-if="description" style="font-size: 14px;">{{ description }}</div>
    <slot />
  </div>
</template>
