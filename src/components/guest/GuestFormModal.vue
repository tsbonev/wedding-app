<script setup lang="ts">
import { NModal, NCard } from 'naive-ui'
import GuestForm from './GuestForm.vue'
import type { Guest } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'

import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{ show: boolean; guest?: Guest }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const guestStore = useGuestStore()
const i18n = useI18nStore()

function handleSubmit(data: Omit<Guest, 'id' | 'createdAt'>) {
  if (props.guest) {
    guestStore.updateGuest(props.guest.id, data)
  } else {
    guestStore.addGuest(data)
  }
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false" @update:show="(val) => !val && emit('close')">
    <n-card
      :title="guest ? i18n.t('edit_guest') : i18n.t('add_guest')"
      style="max-width: 520px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <GuestForm
        :initial="guest"
        :submit-label="guest ? i18n.t('update') : i18n.t('add_guest')"
        @submit="handleSubmit"
        @cancel="emit('close')"
      />
    </n-card>
  </n-modal>
</template>
