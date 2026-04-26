<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton } from 'naive-ui'
import GuestForm from '@/components/guest/GuestForm.vue'
import { useGuestStore } from '@/stores/useGuestStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Guest } from '@/types'

const route = useRoute()
const router = useRouter()
const guestStore = useGuestStore()
const i18n = useI18nStore()

const isNew = computed(() => route.params.id === 'new')
const existing = computed(() => isNew.value ? undefined : guestStore.getById(route.params.id as string))

function handleSubmit(data: Omit<Guest, 'id' | 'createdAt'>) {
  if (isNew.value) {
    guestStore.addGuest(data)
  } else if (existing.value) {
    guestStore.updateGuest(existing.value.id, data)
  }
  router.push('/guests')
}
</script>

<template>
  <div style="max-width: 560px;">
    <n-button quaternary @click="router.back()" style="margin-bottom:16px;">← {{ i18n.t('back') }}</n-button>
    <n-card :title="isNew ? i18n.t('add_guest') : i18n.t('edit_guest')">
      <GuestForm
        :initial="existing"
        :submit-label="isNew ? i18n.t('add_guest') : i18n.t('update')"
        @submit="handleSubmit"
        @cancel="router.back()"
      />
    </n-card>
  </div>
</template>
