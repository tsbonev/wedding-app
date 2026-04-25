<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import type { RSVPStatus } from '@/types'

const props = defineProps<{ status: RSVPStatus }>()

const map: Record<RSVPStatus, { type: 'success' | 'error' | 'warning'; label: string }> = {
  confirmed: { type: 'success', label: 'Confirmed' },
  declined: { type: 'error', label: 'Declined' },
  pending: { type: 'warning', label: 'Pending' },
}

const tag = computed(() => map[props.status])
</script>

<template>
  <n-tag :type="tag.type" size="small">{{ tag.label }}</n-tag>
</template>
