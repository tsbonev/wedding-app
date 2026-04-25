<script setup lang="ts">
import { computed } from 'vue'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import type { Guest } from '@/types'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
  unassignedGuests: Guest[]
}>()

const guestStore = useGuestStore()
const seatingStore = useSeatingStore()

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)

function onDrop(event: DragEvent) {
  event.preventDefault()
  const guestId = event.dataTransfer?.getData('guestId')
  if (guestId) seatingStore.assignGuest(props.tableId, props.seatIndex, guestId)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

function unassign() {
  if (props.guestId) seatingStore.unassignGuest(props.guestId)
}
</script>

<template>
  <div
    class="seat-badge"
    :class="{ occupied: !!guest, empty: !guest }"
    @drop="onDrop"
    @dragover="onDragOver"
  >
    <template v-if="guest">
      <span class="guest-name">{{ guest.firstName }} {{ guest.lastName[0] }}.</span>
      <button class="unassign-btn" title="Unassign" @click.stop="unassign">×</button>
    </template>
    <template v-else>
      <span class="empty-label">Seat {{ seatIndex + 1 }}</span>
    </template>
  </div>
</template>

<style scoped>
.seat-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px 0;
  min-height: 26px;
  border: 1px dashed #ccc;
}
.occupied {
  background: #f0fdf4;
  border-color: #86efac;
  border-style: solid;
}
.empty {
  background: #fafafa;
  color: #aaa;
}
.guest-name { flex: 1; }
.unassign-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.unassign-btn:hover { color: #e03030; }
</style>
