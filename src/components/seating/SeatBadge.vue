<script setup lang="ts">
import { computed } from 'vue'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGroupStore } from '@/stores/useGroupStore'
import type { Guest } from '@/types'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
  unassignedGuests: Guest[]
}>()

const guestStore = useGuestStore()
const seatingStore = useSeatingStore()
const groupStore = useGroupStore()

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)

const groupColor = computed(() => {
  if (!guest.value?.groupId) return null
  return groupStore.getById(guest.value.groupId)?.color ?? null
})

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
    :style="groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '3px', borderLeftStyle: 'solid', background: groupColor + '18' } : {}"
    @drop="onDrop"
    @dragover="onDragOver"
  >
    <template v-if="guest">
      <span v-if="groupColor" class="group-dot" :style="{ background: groupColor }" :title="groupStore.getById(guest.groupId!)?.name" />
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
  border-color: #86efac;
  border-style: solid;
}
.empty {
  background: #fafafa;
  color: #aaa;
}
.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  margin-right: 4px;
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
