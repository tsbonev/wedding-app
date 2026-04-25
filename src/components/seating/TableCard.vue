<script setup lang="ts">
import { NCard, NTag, NButton, NPopconfirm, NInputNumber, NSpace } from 'naive-ui'
import type { Table, Guest } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import SeatBadge from './SeatBadge.vue'

const props = defineProps<{ table: Table; unassignedGuests: Guest[] }>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()
const seatingStore = useSeatingStore()

function updateDim(key: 'widthCm' | 'lengthCm', val: number | null) {
  seatingStore.updateTable(props.table.id, { [key]: val })
}

function updateCapacity(val: number | null) {
  if (val === null || val < 1) return
  seatingStore.resizeTable(props.table.id, val)
}
</script>

<template>
  <n-card :title="table.name" size="small" style="width: 220px;">
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
