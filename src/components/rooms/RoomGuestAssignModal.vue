<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NCard, NTransfer, NSpace, NButton } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useRoomStore } from '@/stores/useRoomStore'
import type { Room } from '@/types'

const props = defineProps<{ show: boolean; room: Room }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const guestStore = useGuestStore()
const roomStore = useRoomStore()

const selected = ref<string[]>([...props.room.guestIds])

const options = computed(() =>
  guestStore.guests.map((g) => ({
    label: `${g.firstName} ${g.lastName}`,
    value: g.id,
    disabled: false,
  }))
)

function save() {
  // unassign guests removed from this room
  for (const gid of props.room.guestIds) {
    if (!selected.value.includes(gid)) roomStore.unassignGuest(gid)
  }
  // assign newly selected
  roomStore.assignGuests(props.room.id, selected.value)
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card
      :title="`Assign Guests to Room ${room.number}`"
      style="max-width: 560px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <n-transfer
        v-model:value="selected"
        :options="options"
        source-title="All Guests"
        target-title="In This Room"
        style="height: 300px"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('close')">Cancel</n-button>
          <n-button type="primary" @click="save">Save</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
