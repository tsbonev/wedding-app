<script setup lang="ts">
import { NConfigProvider, NGlobalStyle, NDialogProvider, NMessageProvider } from 'naive-ui'
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <n-global-style />
        <AppLayout />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
