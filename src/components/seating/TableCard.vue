<script setup lang="ts">
import { NCard, NTag, NButton, NPopconfirm } from 'naive-ui'
import type { Table, Guest } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import SeatBadge from './SeatBadge.vue'

const props = defineProps<{ table: Table; unassignedGuests: Guest[] }>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()
const seatingStore = useSeatingStore()

let dragging = false
let startX = 0
let startY = 0
let origX = 0
let origY = 0

function onMouseDown(event: MouseEvent) {
  // only drag on the card header area
  if ((event.target as HTMLElement).closest('button')) return
  dragging = true
  startX = event.clientX
  startY = event.clientY
  origX = props.table.posX
  origY = props.table.posY

  function onMove(e: MouseEvent) {
    if (!dragging) return
    seatingStore.updateTable(props.table.id, {
      posX: Math.max(0, origX + e.clientX - startX),
      posY: Math.max(0, origY + e.clientY - startY),
    })
  }
  function onUp() {
    dragging = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div
    class="table-card-wrapper"
    :style="{ left: table.posX + 'px', top: table.posY + 'px' }"
    @mousedown="onMouseDown"
  >
    <n-card
      :title="table.name"
      size="small"
      style="width: 180px; cursor: grab; user-select: none;"
    >
      <template #header-extra>
        <n-tag size="small">{{ table.shape === 'round' ? '⭕' : '⬜' }} {{ table.capacity }}</n-tag>
      </template>

      <SeatBadge
        v-for="seat in table.seats"
        :key="seat.index"
        :table-id="table.id"
        :seat-index="seat.index"
        :guest-id="seat.guestId"
        :unassigned-guests="unassignedGuests"
      />

      <template #action>
        <n-popconfirm @positive-click="emit('delete', table.id)">
          <template #trigger>
            <n-button size="tiny" type="error" ghost>Remove</n-button>
          </template>
          Remove this table and unassign all guests?
        </n-popconfirm>
      </template>
    </n-card>
  </div>
</template>

<style scoped>
.table-card-wrapper {
  position: absolute;
}
</style>
