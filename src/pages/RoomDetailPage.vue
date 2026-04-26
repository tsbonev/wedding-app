<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton } from 'naive-ui'
import RoomForm from '@/components/rooms/RoomForm.vue'
import { useRoomStore } from '@/stores/useRoomStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Room } from '@/types'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const i18n = useI18nStore()

const isNew = computed(() => route.params.id === 'new')
const existing = computed(() => isNew.value ? undefined : roomStore.getById(route.params.id as string))

function handleSubmit(data: Omit<Room, 'id' | 'guestIds'>) {
  if (isNew.value) roomStore.addRoom(data)
  else if (existing.value) roomStore.updateRoom(existing.value.id, data)
  router.push('/rooms')
}
</script>

<template>
  <div style="max-width: 480px;">
    <n-button quaternary @click="router.back()" style="margin-bottom:16px;">← {{ i18n.t('back') }}</n-button>
    <n-card :title="isNew ? i18n.t('add_room') : i18n.t('edit_room')">
      <RoomForm :initial="existing" :submit-label="isNew ? i18n.t('add_room') : i18n.t('update')" @submit="handleSubmit" @cancel="router.back()" />
    </n-card>
  </div>
</template>
