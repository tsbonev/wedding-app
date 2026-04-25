<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useSeatingStore } from '@/stores/useSeatingStore'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
  rotation?: number
}>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const seatingStore = useSeatingStore()

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)

const groupColor = computed(() => {
  if (!guest.value?.groupId) return null
  return groupStore.getById(guest.value.groupId)?.color ?? null
})

const initials = computed(() => {
  if (!guest.value) return ''
  return ((guest.value.firstName?.[0] ?? '') + (guest.value.lastName?.[0] ?? '')).toUpperCase()
})

const fullName = computed(() =>
  guest.value ? `${guest.value.firstName} ${guest.value.lastName}` : `Seat ${props.seatIndex + 1}`
)

const isDragOver = ref(false)

function onDragStart(event: DragEvent) {
  if (!guest.value) return
  event.dataTransfer!.setData('guestId', guest.value.id)
  event.dataTransfer!.setData('sourceTableId', props.tableId)
  event.dataTransfer!.setData('sourceSeatIndex', String(props.seatIndex))
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const guestId = event.dataTransfer!.getData('guestId')
  if (!guestId) return
  const sourceTableId = event.dataTransfer!.getData('sourceTableId')
  const sourceSeatIndexStr = event.dataTransfer!.getData('sourceSeatIndex')
  if (sourceTableId && sourceSeatIndexStr !== '') {
    seatingStore.swapSeats(sourceTableId, parseInt(sourceSeatIndexStr), props.tableId, props.seatIndex)
  } else {
    seatingStore.assignGuest(props.tableId, props.seatIndex, guestId)
  }
}

function unassign() {
  if (props.guestId) seatingStore.unassignGuest(props.guestId)
}
</script>

<template>
  <div
    class="seat-token"
    :class="{
      'is-occupied': !!guest,
      'is-empty': !guest,
      'is-drag-over': isDragOver,
    }"
    :style="guest && groupColor ? { background: groupColor } : {}"
    :draggable="!!guest"
    :title="fullName"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @dblclick="unassign"
  >
    <div 
      class="seat-content"
      :style="rotation ? { transform: `rotate(${-rotation}deg)` } : {}"
    >
      <span v-if="guest" class="initials">{{ initials }}</span>
      <span v-else class="seat-num">{{ seatIndex + 1 }}</span>
    </div>
  </div>
</template>

<style scoped>
.seat-token {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
  box-sizing: border-box;
}
.seat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}
.is-occupied {
  color: #fff;
  cursor: grab;
  border-color: transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  font-size: 13px;
}
.is-occupied:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}
.is-occupied:active { cursor: grabbing; }
.is-empty {
  background: #f9fafb;
  color: #9ca3af;
  border-style: dashed;
  cursor: default;
  font-size: 10px;
}
.is-drag-over.is-empty {
  border-color: #60a5fa;
  border-style: solid;
  background: #eff6ff;
  color: #3b82f6;
}
.is-drag-over.is-occupied {
  outline: 3px solid #60a5fa;
  outline-offset: 2px;
}
.initials {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  letter-spacing: 0.5px;
}
</style>
