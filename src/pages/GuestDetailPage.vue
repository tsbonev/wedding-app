<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton } from 'naive-ui'
import GuestForm from '@/components/guest/GuestForm.vue'
import { useGuestStore } from '@/stores/useGuestStore'
import type { Guest } from '@/types'

const route = useRoute()
const router = useRouter()
const guestStore = useGuestStore()

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
    <n-button quaternary @click="router.back()" style="margin-bottom:16px;">← Back</n-button>
    <n-card :title="isNew ? 'Add Guest' : 'Edit Guest'">
      <GuestForm
        :initial="existing"
        :submit-label="isNew ? 'Add Guest' : 'Update'"
        @submit="handleSubmit"
        @cancel="router.back()"
      />
    </n-card>
  </div>
</template>
