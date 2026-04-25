<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton } from 'naive-ui'
import type { Table } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import AerialSeatToken from './AerialSeatToken.vue'

const props = defineProps<{ table: Table }>()
const seatingStore = useSeatingStore()
const isSelected = ref(false)

// ── Selection management ───────────────────────────────────────────────────

function toggleSelection(event: MouseEvent) {
  // If clicking a seat or button, don't toggle selection here
  if ((event.target as HTMLElement).closest('.seat-token, button, .n-button, .rotate-handle')) return
  isSelected.value = !isSelected.value
}

// ── Rectangular seat split ───────────────────────────────────────────────────

const topSeats = computed(() => {
  const half = Math.ceil(props.table.seats.length / 2)
  return props.table.seats.slice(0, half)
})

const bottomSeats = computed(() => {
  const half = Math.ceil(props.table.seats.length / 2)
  return props.table.seats.slice(half)
})

const rectBodyWidth = computed(() =>
  Math.max(topSeats.value.length, 1) * 44 + 24
)

// ── Round seat positioning ───────────────────────────────────────────────────

const roundRadius = computed(() => Math.max(70, props.table.seats.length * 10))
const roundContainerSize = computed(() => 2 * (roundRadius.value + 30))

function seatCircleStyle(index: number) {
  const total = props.table.seats.length
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const r = roundRadius.value
  const center = roundRadius.value + 30
  return {
    position: 'absolute' as const,
    left: `${Math.round(center + r * Math.cos(angle) - 20)}px`,
    top: `${Math.round(center + r * Math.sin(angle) - 20)}px`,
  }
}

const innerCirclePx = computed(() => {
  const d = Math.max(20, 2 * (roundRadius.value - 30))
  const offset = (roundContainerSize.value - d) / 2
  return { d, offset }
})

// ── Dimension label ──────────────────────────────────────────────────────────

const dimsLabel = computed(() => {
  const t = props.table
  if (t.lengthCm && t.widthCm) return `${t.lengthCm}×${t.widthCm} cm`
  return `${t.capacity} seats`
})

// ── Drag to reposition table card ────────────────────────────────────────────

let startX = 0; let startY = 0; let origX = 0; let origY = 0

function onMouseDown(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('.seat-token.is-occupied, button, .n-button, .rotate-handle')) return
  startX = event.clientX; startY = event.clientY
  origX = props.table.aerialPosX; origY = props.table.aerialPosY
  
  isSelected.value = true

  const wrapper = (event.currentTarget as HTMLElement)
  const canvas = wrapper.parentElement
  const canvasWidth = canvas?.clientWidth ?? window.innerWidth
  const canvasHeight = canvas?.clientHeight ?? window.innerHeight
  const rect = wrapper.getBoundingClientRect()

  function onMove(e: MouseEvent) {
    let newX = origX + e.clientX - startX
    let newY = origY + e.clientY - startY

    // Boundary checks: allow movement even if table is larger than canvas
    const minX = Math.min(0, canvasWidth - rect.width)
    const maxX = Math.max(0, canvasWidth - rect.width)
    newX = Math.max(minX, Math.min(newX, maxX))

    const minY = Math.min(0, canvasHeight - rect.height)
    const maxY = Math.max(0, canvasHeight - rect.height)
    newY = Math.max(minY, Math.min(newY, maxY))

    seatingStore.updateTable(props.table.id, {
      aerialPosX: newX,
      aerialPosY: newY,
    })
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)

  // Listen for click outside this table to deselect
  const onOutsideClick = (e: MouseEvent) => {
    if (!(event.currentTarget as HTMLElement).contains(e.target as Node)) {
      isSelected.value = false
      window.removeEventListener('mousedown', onOutsideClick)
    }
  }
  // Delay adding the listener to avoid immediate trigger from current click
  setTimeout(() => {
    window.addEventListener('mousedown', onOutsideClick)
  }, 0)
}

function rotateTable() {
  seatingStore.updateTable(props.table.id, {
    rotation: (props.table.rotation + 45) % 360,
  })
}
</script>

<template>
  <div
    class="aerial-wrapper"
    :class="{ 'is-selected': isSelected }"
    :style="{ 
      left: table.aerialPosX + 'px', 
      top: table.aerialPosY + 'px',
      transform: `rotate(${table.rotation}deg)`
    }"
    @mousedown="onMouseDown"
  >
    <div v-if="isSelected" class="rotate-handle" title="Rotate table" @mousedown.stop="rotateTable">
      🔄
    </div>

    <!-- ── Rectangular ── -->
    <template v-if="table.shape === 'rectangular'">
      <div class="aerial-rect">
        <!-- top seats -->
        <div class="seats-row" :style="{ width: rectBodyWidth + 'px' }">
          <AerialSeatToken
            v-for="seat in topSeats" :key="seat.index"
            :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
            :rotation="table.rotation"
          />
        </div>

        <!-- table body -->
        <div class="rect-body" :style="{ width: rectBodyWidth + 'px' }">
          <div :style="{ transform: `rotate(${-table.rotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">{{ dimsLabel }}</span>
          </div>
        </div>

        <!-- bottom seats -->
        <div class="seats-row" :style="{ width: rectBodyWidth + 'px' }">
          <AerialSeatToken
            v-for="seat in bottomSeats" :key="seat.index"
            :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
            :rotation="table.rotation"
          />
        </div>
      </div>
    </template>

    <!-- ── Round ── -->
    <template v-else>
      <div
        class="aerial-round"
        :style="{ width: roundContainerSize + 'px', height: roundContainerSize + 'px' }"
      >
        <!-- inner table circle -->
        <div
          class="round-inner"
          :style="{
            left: innerCirclePx.offset + 'px',
            top: innerCirclePx.offset + 'px',
            width: innerCirclePx.d + 'px',
            height: innerCirclePx.d + 'px',
          }"
        >
          <div :style="{ transform: `rotate(${-table.rotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">{{ dimsLabel }}</span>
          </div>
        </div>

        <!-- seat tokens positioned around the circle -->
        <AerialSeatToken
          v-for="(seat, idx) in table.seats" :key="seat.index"
          :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
          :rotation="table.rotation"
          :style="seatCircleStyle(idx)"
          style="position:absolute"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.aerial-wrapper {
  position: absolute;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s ease;
}
.aerial-wrapper:active { cursor: grabbing; }
.aerial-wrapper.is-selected {
  outline: 2px solid #3b82f6;
  outline-offset: 4px;
  border-radius: 4px;
}

.rotate-handle {
  position: absolute;
  top: -12px;
  right: -12px;
  background: white;
  border: 1px solid #3b82f6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.rotate-handle:hover {
  background: #eff6ff;
  transform: scale(1.1);
}

/* Rectangular */
.aerial-rect {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.seats-row {
  display: flex;
  gap: 4px;
  justify-content: center;
  padding: 4px 0;
  box-sizing: border-box;
}
.rect-body {
  background: #d1d5db;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  min-height: 52px;
  gap: 2px;
  box-sizing: border-box;
  position: relative;
}
.text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

/* Round */
.aerial-round {
  position: relative;
}
.round-inner {
  position: absolute;
  border-radius: 50%;
  background: #d1d5db;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px;
  box-sizing: border-box;
  text-align: center;
}

/* Shared text */
.tname {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  line-height: 1.2;
}
.tdims {
  font-size: 10px;
  color: #6b7280;
  line-height: 1.2;
}
</style>
