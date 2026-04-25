<script setup lang="ts">
import { NModal, NCard } from 'naive-ui'
import RoomForm from './RoomForm.vue'
import type { Room } from '@/types'
import { useRoomStore } from '@/stores/useRoomStore'

const props = defineProps<{ show: boolean; room?: Room }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const roomStore = useRoomStore()

function handleSubmit(data: Omit<Room, 'id' | 'guestIds'>) {
  if (props.room) roomStore.updateRoom(props.room.id, data)
  else roomStore.addRoom(data)
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card
      :title="room ? 'Edit Room' : 'Add Room'"
      style="max-width: 480px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <RoomForm :initial="room" :submit-label="room ? 'Update' : 'Add Room'" @submit="handleSubmit" @cancel="emit('close')" />
    </n-card>
  </n-modal>
</template>
