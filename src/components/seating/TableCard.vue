<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NCard, NButton, NPopconfirm, NInputNumber, NSpace, NInput, useDialog } from 'naive-ui'
import type { Table, SeatOriginCorner } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import SeatBadge from './SeatBadge.vue'

const props = defineProps<{ table: Table }>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()
const seatingStore = useSeatingStore()
const dialog = useDialog()
const isConfirming = ref(false)
const localCapacity = ref(props.table.capacity)

watch(() => props.table.capacity, (newVal) => {
  localCapacity.value = newVal
})

function updateDim(key: 'widthCm' | 'lengthCm', val: number | null) {
  seatingStore.updateTable(props.table.id, { [key]: val })
}

function updateCapacity() {
  const val = localCapacity.value
  if (val === null || val < 1 || isConfirming.value) return
  
  const assignedGuestsCount = props.table.seats.filter(s => s.guestId !== null).length
  if (val < assignedGuestsCount) {
    isConfirming.value = true
    dialog.warning({
      title: 'Confirm Capacity Change',
      content: `Reducing capacity to ${val} will unassign ${assignedGuestsCount - val} guests. Are you sure?`,
      positiveText: 'Confirm',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        seatingStore.resizeTable(props.table.id, val)
        isConfirming.value = false
      },
      onNegativeClick: () => {
        localCapacity.value = props.table.capacity
        isConfirming.value = false
      },
      onClose: () => {
        localCapacity.value = props.table.capacity
        isConfirming.value = false
      },
      onMaskClick: () => {
        localCapacity.value = props.table.capacity
        isConfirming.value = false
      }
    })
  } else {
    seatingStore.resizeTable(props.table.id, val)
  }
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
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 16px;">{{ table.shape === 'round' ? '⭕' : '⬜' }}</span>
        <n-input-number
          v-model:value="localCapacity"
          size="tiny"
          :min="1"
          :max="40"
          :show-button="false"
          style="width: 40px;"
          @blur="updateCapacity"
          @keyup.enter="updateCapacity"
        />
      </div>
    </template>

    <div class="table-dims-edit-top">
      <n-space size="small">
        <div v-if="table.shape === 'rectangular'">
          <div class="dim-label">Length</div>
          <n-input-number
            :value="table.lengthCm"
            size="tiny"
            placeholder="Len"
            :show-button="false"
            style="width: 50px"
            @update:value="updateDim('lengthCm', $event)"
          />
        </div>
        <div>
          <div class="dim-label">{{ table.shape === 'rectangular' ? 'Width' : 'Diam' }}</div>
          <n-input-number
            :value="table.widthCm"
            size="tiny"
            placeholder="Wid"
            :show-button="false"
            style="width: 50px"
            @update:value="updateDim('widthCm', $event)"
          />
        </div>
      </n-space>
    </div>

    <SeatBadge
      v-for="seat in sortedSeats"
      :key="seat.index"
      :table-id="table.id"
      :seat-index="seat.index"
      :guest-id="seat.guestId"
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
</template>

<style scoped>
.table-dims-edit-top {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}
.dim-label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 2px;
}
</style>
