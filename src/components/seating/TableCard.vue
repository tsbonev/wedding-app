<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NTag, NButton, NPopconfirm, NInputNumber, NSpace, NInput } from 'naive-ui'
import type { Table, SeatOriginCorner } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import SeatBadge from './SeatBadge.vue'

const props = defineProps<{ table: Table }>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()
const seatingStore = useSeatingStore()

function updateDim(key: 'widthCm' | 'lengthCm', val: number | null) {
  seatingStore.updateTable(props.table.id, { [key]: val })
}

function updateCapacity(val: number | null) {
  if (val === null || val < 1) return
  seatingStore.resizeTable(props.table.id, val)
}

function displayIndex(seatIndex: number): number {
  const n = props.table.seats.length
  const half = Math.ceil(n / 2)
  const corner: SeatOriginCorner | null = props.table.seatOriginCorner
  const i = seatIndex
  if (!corner || corner === 'tl') return i
  if (props.table.shape === 'rectangular') {
    if (corner === 'tr') return i < half ? half - 1 - i : half + (n - 1 - i)
    if (corner === 'bl') return i >= half ? i - half : (n - half) + i
    return n - 1 - i // br
  }
  // round
  const cornerDeg: Record<SeatOriginCorner, number> = { tl: 225, tr: 315, br: 45, bl: 135 }
  const ca = cornerDeg[corner]
  let startK = 0; let minDist = Infinity
  for (let k = 0; k < n; k++) {
    const deg = ((k / n) * 360 - 90 + 360) % 360
    let d = Math.abs(deg - ca); if (d > 180) d = 360 - d
    if (d < minDist) { minDist = d; startK = k }
  }
  return (i - startK + n) % n
}

const sortedSeats = computed(() =>
  [...props.table.seats].sort((a, b) => displayIndex(a.index) - displayIndex(b.index))
)
</script>

<template>
  <n-card size="small" style="width: 220px;">
    <template #header>
      <n-input
        :value="table.name"
        size="small"
        style="font-weight: 600;"
        @update:value="seatingStore.updateTable(table.id, { name: $event })"
      />
    </template>
    <template #header-extra>
      <n-tag size="small">{{ table.shape === 'round' ? '⭕' : '⬜' }} {{ table.capacity }}</n-tag>
    </template>

    <SeatBadge
      v-for="seat in sortedSeats"
      :key="seat.index"
      :table-id="table.id"
      :seat-index="seat.index"
      :guest-id="seat.guestId"
    />

    <div class="table-dims-edit">
      <n-space vertical size="small">
        <div>
          <div class="dim-label">Seats</div>
          <n-input-number
            :value="table.capacity"
            size="tiny"
            :min="1"
            :max="40"
            @update:value="updateCapacity($event)"
          />
        </div>
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
</template>

<style scoped>
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
