<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Table, SeatOriginCorner } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import AerialSeatToken from './AerialSeatToken.vue'

const props = defineProps<{ table: Table }>()
const seatingStore = useSeatingStore()
const isSelected = ref(false)
const el = ref<HTMLElement | null>(null)

const CORNERS: SeatOriginCorner[] = ['tl', 'tr', 'bl', 'br']

// ── Selection management ───────────────────────────────────────────────────

function setupOutsideClick() {
  function handler(e: MouseEvent) {
    if (!el.value?.contains(e.target as Node)) {
      isSelected.value = false
      window.removeEventListener('mousedown', handler)
    }
  }
  setTimeout(() => window.addEventListener('mousedown', handler), 0)
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

// ── Seat count label ─────────────────────────────────────────────────────────

const assignedCount = computed(() => props.table.seats.filter(s => s.guestId !== null).length)

// ── Drag to reposition ────────────────────────────────────────────────────────

let startX = 0; let startY = 0; let origX = 0; let origY = 0

function onMouseDown(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('.seat-token, button, .n-button, .corner-handle, .origin-dot')) return

  if (!isSelected.value) {
    isSelected.value = true
    setupOutsideClick()
  }

  startX = event.clientX; startY = event.clientY
  origX = props.table.aerialPosX; origY = props.table.aerialPosY

  const canvas = (el.value as HTMLElement).parentElement
  const canvasWidth = canvas?.clientWidth ?? window.innerWidth
  const canvasHeight = canvas?.clientHeight ?? window.innerHeight
  const rect = el.value!.getBoundingClientRect()

  let moved = false
  function onMove(e: MouseEvent) {
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return
    moved = true
    let newX = origX + e.clientX - startX
    let newY = origY + e.clientY - startY
    const minX = Math.min(0, canvasWidth - rect.width)
    const maxX = Math.max(0, canvasWidth - rect.width)
    newX = Math.max(minX, Math.min(newX, maxX))
    const minY = Math.min(0, canvasHeight - rect.height)
    const maxY = Math.max(0, canvasHeight - rect.height)
    newY = Math.max(minY, Math.min(newY, maxY))
    seatingStore.updateTable(props.table.id, { aerialPosX: newX, aerialPosY: newY })
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Corner drag-to-rotate (snaps to 45° on release) ─────────────────────────

function onCornerMouseDown(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()

  const rect = el.value!.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI)
  const startRotation = props.table.rotation

  function onMove(e: MouseEvent) {
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
    const delta = angle - startAngle
    const raw = ((startRotation + delta) % 360 + 360) % 360
    seatingStore.updateTable(props.table.id, { rotation: raw })
  }

  function onUp() {
    const snapped = (Math.round(props.table.rotation / 45) * 45 + 360) % 360
    seatingStore.updateTable(props.table.id, { rotation: snapped })
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ── Origin dot click: set seat numbering origin ───────────────────────────────

function setOrigin(corner: SeatOriginCorner) {
  seatingStore.updateTable(props.table.id, { seatOriginCorner: corner })
}
</script>

<template>
  <div
    ref="el"
    class="aerial-wrapper"
    :class="{ 'is-selected': isSelected }"
    :style="{
      left: table.aerialPosX + 'px',
      top: table.aerialPosY + 'px',
      transform: `rotate(${table.rotation}deg)`
    }"
    @mousedown="onMouseDown"
  >
    <!-- Rotation corner handles (drag only) -->
    <template v-if="isSelected">
      <div class="corner-handle tl" title="Drag to rotate" @mousedown="onCornerMouseDown" />
      <div class="corner-handle tr" title="Drag to rotate" @mousedown="onCornerMouseDown" />
      <div class="corner-handle bl" title="Drag to rotate" @mousedown="onCornerMouseDown" />
      <div class="corner-handle br" title="Drag to rotate" @mousedown="onCornerMouseDown" />
    </template>

    <!-- ── Rectangular ── -->
    <template v-if="table.shape === 'rectangular'">
      <div class="aerial-rect">
        <div class="seats-row" :style="{ width: rectBodyWidth + 'px' }">
          <AerialSeatToken
            v-for="seat in topSeats" :key="seat.index"
            :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
            :rotation="table.rotation"
          />
        </div>

        <div class="rect-body" :style="{ width: rectBodyWidth + 'px' }">
          <!-- Seat-origin corner dots (visible when selected) -->
          <template v-if="isSelected">
            <div
              v-for="c in CORNERS" :key="`origin-${c}`"
              class="origin-dot" :class="[c, { 'is-origin': table.seatOriginCorner === c }]"
              title="Click to start seat numbering here"
              @mousedown.stop="setOrigin(c)"
            />
          </template>
          <div :style="{ transform: `rotate(${-table.rotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">({{ assignedCount }}/{{ table.capacity }})</span>
          </div>
        </div>

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
        <div
          class="round-inner"
          :style="{
            left: innerCirclePx.offset + 'px',
            top: innerCirclePx.offset + 'px',
            width: innerCirclePx.d + 'px',
            height: innerCirclePx.d + 'px',
          }"
        >
          <!-- Seat-origin corner dots (visible when selected) -->
          <template v-if="isSelected">
            <div
              v-for="c in CORNERS" :key="`origin-${c}`"
              class="origin-dot origin-dot-round" :class="[c, { 'is-origin': table.seatOriginCorner === c }]"
              title="Click to start seat numbering here"
              @mousedown.stop="setOrigin(c)"
            />
          </template>
          <div :style="{ transform: `rotate(${-table.rotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">({{ assignedCount }}/{{ table.capacity }})</span>
          </div>
        </div>

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

/* Rotation corner handles */
.corner-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border: 2px solid #fff;
  border-radius: 3px;
  cursor: alias;
  z-index: 10;
}
.corner-handle:hover { background: #2563eb; }
.corner-handle.tl { top: -8px; left: -8px; }
.corner-handle.tr { top: -8px; right: -8px; }
.corner-handle.bl { bottom: -8px; left: -8px; }
.corner-handle.br { bottom: -8px; right: -8px; }

/* Origin dots inside the table body */
.origin-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 2px;
  cursor: pointer;
  z-index: 5;
  transition: background 0.12s;
}
.origin-dot:hover { background: #d97706; }
.origin-dot.is-origin { background: #f59e0b; }
.origin-dot.tl { top: 4px; left: 4px; }
.origin-dot.tr { top: 4px; right: 4px; }
.origin-dot.bl { bottom: 4px; left: 4px; }
.origin-dot.br { bottom: 4px; right: 4px; }

/* Round table origin dots: percentage-based to stay inside circle */
.origin-dot-round.tl { top: 18%; left: 18%; }
.origin-dot-round.tr { top: 18%; right: 18%; }
.origin-dot-round.bl { bottom: 18%; left: 18%; }
.origin-dot-round.br { bottom: 18%; right: 18%; }

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
