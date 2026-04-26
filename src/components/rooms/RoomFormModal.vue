<script setup lang="ts">
import { NModal, NCard } from 'naive-ui'
import RoomForm from './RoomForm.vue'
import type { Room } from '@/types'
import { useRoomStore } from '@/stores/useRoomStore'

import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{ show: boolean; room?: Room }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const roomStore = useRoomStore()
const i18n = useI18nStore()

function handleSubmit(data: Omit<Room, 'id' | 'guestIds'>) {
  if (props.room) roomStore.updateRoom(props.room.id, data)
  else roomStore.addRoom(data)
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card
      :title="room ? i18n.t('edit_room') : i18n.t('add_room')"
      style="max-width: 540px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <RoomForm :initial="room" :submit-label="room ? i18n.t('update') : i18n.t('add_room')" @submit="handleSubmit" @cancel="emit('close')" />
    </n-card>
  </n-modal>
</template>
