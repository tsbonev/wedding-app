<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import type { RSVPStatus } from '@/types'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{ status: RSVPStatus }>()
const i18n = useI18nStore()

const tag = computed(() => {
  const map: Record<RSVPStatus, { type: 'success' | 'error' | 'warning'; label: string }> = {
    confirmed: { type: 'success', label: i18n.t('confirmed') },
    declined: { type: 'error', label: i18n.t('declined') },
    pending: { type: 'warning', label: i18n.t('pending') },
  }
  return map[props.status]
})
</script>

<template>
  <n-tag :type="tag.type" size="small">{{ tag.label }}</n-tag>
</template>
