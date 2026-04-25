<script setup lang="ts">
import { NCard, NTag, NButton, NPopconfirm, NInputNumber, NSpace } from 'naive-ui'
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
  if ((event.target as HTMLElement).closest('button, .n-input-number')) return
  dragging = true
  startX = event.clientX
  startY = event.clientY
  origX = props.table.posX
  origY = props.table.posY

  const wrapper = (event.currentTarget as HTMLElement)
  const canvas = wrapper.parentElement
  const canvasWidth = canvas?.clientWidth ?? window.innerWidth
  const canvasHeight = canvas?.clientHeight ?? window.innerHeight
  const rect = wrapper.getBoundingClientRect()

  function onMove(e: MouseEvent) {
    if (!dragging) return
    let newX = origX + e.clientX - startX
    let newY = origY + e.clientY - startY

    // Boundary checks: allow movement even if card is larger than canvas
    const minX = Math.min(0, canvasWidth - rect.width)
    const maxX = Math.max(0, canvasWidth - rect.width)
    newX = Math.max(minX, Math.min(newX, maxX))

    const minY = Math.min(0, canvasHeight - rect.height)
    const maxY = Math.max(0, canvasHeight - rect.height)
    newY = Math.max(minY, Math.min(newY, maxY))

    seatingStore.updateTable(props.table.id, {
      posX: newX,
      posY: newY,
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

function updateDim(key: 'widthCm' | 'lengthCm', val: number | null) {
  seatingStore.updateTable(props.table.id, { [key]: val })
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

      <div class="table-dims-edit">
        <n-space vertical size="small">
          <div v-if="table.shape === 'rectangular'">
            <div class="dim-label">Length (cm)</div>
            <n-input-number
              :value="table.lengthCm"
              size="tiny"
              placeholder="Len"
              @update:value="updateDim('lengthCm', $event)"
            />
          </div>
          <div>
            <div class="dim-label">{{ table.shape === 'rectangular' ? 'Width' : 'Diameter' }} (cm)</div>
            <n-input-number
              :value="table.widthCm"
              size="tiny"
              placeholder="Wid"
              @update:value="updateDim('widthCm', $event)"
            />
          </div>
        </n-space>
      </div>

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
.table-dims-edit {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}
.dim-label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 2px;
}
</style>
