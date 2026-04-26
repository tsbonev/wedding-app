<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>()
</script>

<template>
  <div class="empty-state">
    <div class="icon">{{ icon ?? '📭' }}</div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-description">{{ description }}</div>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: #999;
}
.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}
.empty-description {
  font-size: 14px;
}
@media (max-width: 767px) {
  .empty-state { padding: 28px 16px; }
  .icon { font-size: 32px; }
}
</style>
