<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Table, SeatOriginCorner, Seat } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import AerialSeatToken from './AerialSeatToken.vue'
import { getDisplaySeatNumber, SEAT_TOKEN_SIZE, SEAT_GAP, SEAT_ROW_PADDING, RECT_BODY_HEIGHT, ROUND_RADIUS_BASE, ROUND_RADIUS_PER_SEAT, ROUND_RADIUS_MIN } from '@/utils/seatNumber'

const props = defineProps<{ table: Table }>()
const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()
const seatingStore = useSeatingStore()
const configStore = useAppConfigStore()

const seatedCount = computed(() => props.table.seats.filter(s => s.guestId).length)

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
  if (props.table.oneSided) return props.table.seats
  const half = Math.ceil(props.table.seats.length / 2)
  return props.table.seats.slice(0, half)
})

const bottomSeats = computed(() => {
  if (props.table.oneSided) return []
  const half = Math.ceil(props.table.seats.length / 2)
  return props.table.seats.slice(half)
})

const rectBodyWidth = computed(() => {
  const count = Math.max(topSeats.value.length, 1)
  return count * SEAT_TOKEN_SIZE + (count - 1) * SEAT_GAP + SEAT_ROW_PADDING
})

const rectBodyHeight = RECT_BODY_HEIGHT

const textRotation = computed(() => {
  const name = props.table.name
  // Rough estimate of text width: 7px per character for 11px font-size
  const estimatedTextWidth = name.length * 7

  const rad = (props.table.rotation * Math.PI) / 180
  const absCos = Math.abs(Math.cos(rad))
  const absSin = Math.abs(Math.sin(rad))

  if (props.table.shape === 'rectangular') {
    const w = rectBodyWidth.value
    const h = rectBodyHeight
    
    // The maximum horizontal width available inside a rotated rectangle of width w and height h
    // at its center is min(w / absCos, h / absSin).
    let availableHorizontalWidth = w
    if (absCos > 0.01 && absSin > 0.01) {
      availableHorizontalWidth = Math.min(w / absCos, h / absSin)
    } else if (absCos <= 0.01) {
      // Near 90 or 270 degrees
      availableHorizontalWidth = h
    } else {
      // Near 0 or 180 degrees
      availableHorizontalWidth = w
    }
    
    // If it fits screen-horizontally within the table's internal horizontal space with some padding
    if (estimatedTextWidth < availableHorizontalWidth - 10) {
      return -props.table.rotation
    }

    // Otherwise, orient with the table (along the long axis W)
    // To be upright on screen, if the table is rotated such that its W axis 
    // points downwards, we flip it 180.
    const normRot = ((props.table.rotation % 360) + 360) % 360
    if (normRot > 90 && normRot <= 270) {
      return 180
    }
    return 0
  } else if (props.table.shape === 'round') {
    const d = innerCirclePx.value.d
    // For a circle, available horizontal width is always d.
    if (estimatedTextWidth < d - 10) {
      return -props.table.rotation
    }
    
    // Otherwise orient with the table's local rotation
    const normRot = ((props.table.rotation % 360) + 360) % 360
    if (normRot > 90 && normRot <= 270) {
      return 180
    }
    return 0
  }

  return -props.table.rotation
})

// ── Round seat positioning ───────────────────────────────────────────────────

const roundRadius = computed(() => Math.max(ROUND_RADIUS_MIN, props.table.seats.length * ROUND_RADIUS_PER_SEAT))
const roundContainerSize = computed(() => 2 * (roundRadius.value + ROUND_RADIUS_BASE))

function seatCircleStyle(index: number) {
  const total = props.table.seats.length
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const r = roundRadius.value
  const center = roundRadius.value + ROUND_RADIUS_BASE
  const half = SEAT_TOKEN_SIZE / 2
  return {
    position: 'absolute' as const,
    left: `${Math.round(center + r * Math.cos(angle) - half)}px`,
    top: `${Math.round(center + r * Math.sin(angle) - half)}px`,
  }
}

const innerCirclePx = computed(() => {
  const d = Math.max(20, 2 * (roundRadius.value - 30))
  const offset = (roundContainerSize.value - d) / 2
  return { d, offset }
})

function displaySeatNum(seat: Seat) {
  return getDisplaySeatNumber(props.table, seat.index)
}

function seatIndStyle(index: number) {
  const total = props.table.seats.length
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  const r = innerCirclePx.value.d / 2 - 10
  const center = innerCirclePx.value.d / 2
  return {
    position: 'absolute' as const,
    left: `${Math.round(center + r * Math.cos(angle) - 10)}px`,
    top: `${Math.round(center + r * Math.sin(angle) - 10)}px`,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    color: '#9ca3af',
    fontWeight: '700',
    pointerEvents: 'none' as const,
  }
}

// ── Drag to reposition ────────────────────────────────────────────────────────

let startX = 0; let startY = 0; let origX = 0; let origY = 0

function onPointerDown(event: PointerEvent) {
  if (configStore.isLinkingMode) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if ((event.target as HTMLElement).closest('.seat-token, button, .n-button, .corner-handle, .origin-dot')) return

  if (!isSelected.value) {
    isSelected.value = true
    setupOutsideClick()
  }

  startX = event.clientX; startY = event.clientY
  origX = props.table.aerialPosX; origY = props.table.aerialPosY
  const pointerId = event.pointerId

  const rect = el.value!.getBoundingClientRect()
  el.value?.setPointerCapture(pointerId)

  let moved = false
  function onMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return
    moved = true
    
    // Adjust movement based on zoom level
    const dx = (e.clientX - startX) / configStore.zoomLevel
    const dy = (e.clientY - startY) / configStore.zoomLevel
    
    let newX = origX + dx
    let newY = origY + dy
    
    // Prevent moving out of top/left bounds
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)

    // Expand canvas if moving right or down
    const tableRight = newX + rect.width / configStore.zoomLevel
    const tableBottom = newY + rect.height / configStore.zoomLevel
    
    if (tableRight > configStore.canvasWidth) {
      configStore.canvasWidth = Math.ceil(tableRight + 100)
    }
    if (tableBottom > configStore.canvasHeight) {
      configStore.canvasHeight = Math.ceil(tableBottom + 100)
    }

    seatingStore.updateTable(props.table.id, { aerialPosX: newX, aerialPosY: newY })
  }
  function onUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    el.value?.releasePointerCapture(pointerId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

// ── Corner drag-to-rotate (snaps to 45° on release) ─────────────────────────

function onCornerPointerDown(event: PointerEvent) {
  if (configStore.isLinkingMode) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  event.stopPropagation()
  event.preventDefault()

  const rect = el.value!.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI)
  const startRotation = props.table.rotation

  const pointerId = event.pointerId
  el.value?.setPointerCapture(pointerId)

  function onMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
    const delta = (angle - startAngle) // Rotation doesn't need zoom adjustment as it's angle based
    const raw = ((startRotation + delta) % 360 + 360) % 360
    seatingStore.updateTable(props.table.id, { rotation: raw })
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    const snapped = (Math.round(props.table.rotation / 45) * 45 + 360) % 360
    seatingStore.updateTable(props.table.id, { rotation: snapped })
    el.value?.releasePointerCapture(pointerId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
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
    @pointerdown="onPointerDown"
  >
    <!-- Rotation corner handles (drag only) -->
    <template v-if="isSelected">
      <div class="corner-handle tl" title="Drag to rotate" @pointerdown="onCornerPointerDown" />
      <div class="corner-handle tr" title="Drag to rotate" @pointerdown="onCornerPointerDown" />
      <div class="corner-handle bl" title="Drag to rotate" @pointerdown="onCornerPointerDown" />
      <div class="corner-handle br" title="Drag to rotate" @pointerdown="onCornerPointerDown" />
    </template>

    <!-- ── Rectangular ── -->
    <template v-if="table.shape === 'rectangular'">
      <div class="aerial-rect">
        <div class="seats-row" :style="{ width: rectBodyWidth + 'px' }">
          <AerialSeatToken
            v-for="seat in topSeats" :key="seat.index"
            :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
            :rotation="table.rotation"
            @edit-guest="emit('edit-guest', $event)"
          />
        </div>

        <div class="rect-body" :style="{ width: rectBodyWidth + 'px' }">
          <!-- Seat numbers for top row -->
          <div class="rect-numbers top">
            <span
              v-for="seat in topSeats"
              :key="`num-${seat.index}`"
              class="rect-num"
              :style="{ transform: `rotate(${-table.rotation}deg)` }"
            >
              {{ displaySeatNum(seat) }}
            </span>
          </div>
          <!-- Seat-origin corner dots (visible when selected) -->
          <template v-if="isSelected">
            <div
              v-for="c in CORNERS" :key="`origin-${c}`"
              class="origin-dot" :class="[c, { 'is-origin': table.seatOriginCorner === c }]"
              title="Click to start seat numbering here"
              @pointerdown.stop="setOrigin(c)"
            />
          </template>
          <div :style="{ transform: `rotate(${textRotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">{{ seatedCount }} / {{ table.capacity }}</span>
          </div>
          <!-- Seat numbers for bottom row -->
          <div class="rect-numbers bottom">
            <span
              v-for="seat in bottomSeats"
              :key="`num-${seat.index}`"
              class="rect-num"
              :style="{ transform: `rotate(${-table.rotation}deg)` }"
            >
              {{ displaySeatNum(seat) }}
            </span>
          </div>
        </div>

        <div class="seats-row" :style="{ width: rectBodyWidth + 'px' }">
          <AerialSeatToken
            v-for="seat in bottomSeats" :key="seat.index"
            :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
            :rotation="table.rotation"
            @edit-guest="emit('edit-guest', $event)"
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
              @pointerdown.stop="setOrigin(c)"
            />
          </template>
          <div :style="{ transform: `rotate(${textRotation}deg)` }" class="text-container">
            <span class="tname">{{ table.name }}</span>
            <span class="tdims">{{ seatedCount }} / {{ table.capacity }}</span>
          </div>
          <span
            v-for="(seat, idx) in table.seats"
            :key="`rnum-${seat.index}`"
            class="round-num"
            :style="{ ...seatIndStyle(idx), transform: `rotate(${-table.rotation}deg)` }"
          >
            {{ displaySeatNum(seat) }}
          </span>
        </div>

        <AerialSeatToken
          v-for="(seat, idx) in table.seats" :key="seat.index"
          :table-id="table.id" :seat-index="seat.index" :guest-id="seat.guestId"
          :rotation="table.rotation"
          :style="seatCircleStyle(idx)"
          style="position:absolute"
          @edit-guest="emit('edit-guest', $event)"
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
  touch-action: none;
  transition: box-shadow 0.2s ease;
  z-index: 2;
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
  gap: 8px;
  justify-content: center;
  padding: 6px 0;
  box-sizing: border-box;
}
.rect-body {
  background: var(--table-body-bg);
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 10px;
  min-height: 64px;
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
  background: var(--table-body-bg);
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
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
  color: var(--text-strong);
  line-height: 1.2;
}
.tdims {
  font-size: 11px;
  color: var(--text-strong);
  font-weight: 700;
  line-height: 1.2;
}
.round-num {
  pointer-events: none;
}
.rect-numbers {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
  transition: transform 0.2s ease;
}
.rect-numbers.top { top: 2px; }
.rect-numbers.bottom { bottom: 2px; }
.rect-num {
  width: 40px;
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
</style>
