<script setup lang="ts">
import { NConfigProvider, NGlobalStyle } from 'naive-ui'
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <n-config-provider>
    <n-global-style />
    <AppLayout />
  </n-config-provider>
</template>
