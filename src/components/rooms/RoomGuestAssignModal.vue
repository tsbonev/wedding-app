<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NCard, NTransfer, NSpace, NButton } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Room } from '@/types'

const props = defineProps<{ show: boolean; room: Room }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const guestStore = useGuestStore()
const roomStore = useRoomStore()
const i18n = useI18nStore()

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
      :title="`${i18n.t('assign_guests')} ${i18n.t('room')} ${room.number}`"
      style="max-width: 800px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <n-transfer
        v-model:value="selected"
        :options="options"
        :source-title="i18n.t('guests')"
        :target-title="i18n.t('assigned')"
        :filter-placeholder="i18n.t('search_guests')"
        :select-all-text="i18n.t('select_all')"
        :unselect-all-text="i18n.t('unselect_all')"
        :clear-text="i18n.t('clear')"
        filterable
        style="height: 500px"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('close')">{{ i18n.t('cancel') }}</n-button>
          <n-button type="primary" @click="save">{{ i18n.t('save') }}</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
