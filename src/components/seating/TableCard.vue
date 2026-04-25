<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NCard, NButton, NPopconfirm, NInputNumber, NSpace, NInput, NCheckbox, useDialog } from 'naive-ui'
import type { Table, SeatOriginCorner } from '@/types'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useI18nStore } from '@/stores/useI18nStore'
import SeatBadge from './SeatBadge.vue'

const props = defineProps<{ table: Table }>()
const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'edit-guest', id: string): void
}>()
const seatingStore = useSeatingStore()
const i18n = useI18nStore()
const dialog = useDialog()
const isConfirming = ref(false)
const localCapacity = ref(props.table.capacity)
const localName = ref(props.table.name)

watch(() => props.table.capacity, (newVal) => {
  localCapacity.value = newVal
})

watch(() => props.table.name, (newVal) => {
  localName.value = newVal
})

function updateDim(key: 'widthCm' | 'lengthCm', val: number | null) {
  seatingStore.updateTable(props.table.id, { [key]: val })
}

function updateName() {
  if (localName.value.trim() === '') {
    localName.value = props.table.name
    return
  }
  seatingStore.updateTable(props.table.id, { name: localName.value })
}

function toggleShape() {
  const newShape = props.table.shape === 'round' ? 'rectangular' : 'round'
  seatingStore.updateTable(props.table.id, { shape: newShape })
}

function updateCapacity() {
  const val = localCapacity.value
  if (val === null || val < 1 || isConfirming.value) return
  
  const assignedGuestsCount = props.table.seats.filter(s => s.guestId !== null).length
  if (val < assignedGuestsCount) {
    isConfirming.value = true
    dialog.warning({
      title: i18n.t('confirm_capacity_change'),
      content: i18n.t('capacity_change_warning').replace('{val}', String(val)).replace('{count}', String(assignedGuestsCount - val)),
      positiveText: i18n.t('confirmed'),
      negativeText: i18n.t('cancel'),
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
  const corner = props.table.seatOriginCorner
  const i = seatIndex
  if (!corner) return i
  if (corner === 'tl') return i
  if (props.table.shape === 'rectangular') {
    if (props.table.oneSided) {
      if (corner === 'bl') return i
      return n - 1 - i
    }
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
      <div class="print-table-name">{{ localName }}</div>
      <n-input
        v-model:value="localName"
        size="small"
        style="font-weight: 600;"
        class="no-print-input"
        @blur="updateName"
        @keyup.enter="updateName"
      />
    </template>
    <template #header-extra>
      <div style="display: flex; align-items: center; gap: 4px;">
        <span
          style="font-size: 16px; cursor: pointer; user-select: none;"
          :title="i18n.t('toggle_shape')"
          @click="toggleShape"
        >
          {{ table.shape === 'round' ? '⚪' : '⬜' }}
        </span>
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

    <div class="print-table-info">
      {{ table.shape === 'round' ? '⚪' : '⬜' }}
      {{ table.capacity }} {{ i18n.t('seats') }} |
      <template v-if="table.shape === 'rectangular'">
        {{ table.lengthCm }}x{{ table.widthCm }} cm
      </template>
      <template v-else>
        Ø {{ table.widthCm }} cm
      </template>
    </div>

    <div class="table-dims-edit-top no-print">
      <n-space size="small">
        <div v-if="table.shape === 'rectangular'">
          <div class="dim-label">{{ i18n.t('length') }}</div>
          <n-input-number
            :value="table.lengthCm"
            size="tiny"
            :placeholder="i18n.t('len')"
            :show-button="false"
            style="width: 50px"
            @update:value="updateDim('lengthCm', $event)"
          />
        </div>
        <div>
          <div class="dim-label">{{ table.shape === 'rectangular' ? i18n.t('width') : i18n.t('diam') }}</div>
          <n-input-number
            :value="table.widthCm"
            size="tiny"
            :placeholder="i18n.t('wid')"
            :show-button="false"
            style="width: 50px"
            @update:value="updateDim('widthCm', $event)"
          />
        </div>
        <div v-if="table.shape === 'rectangular'" style="display: flex; align-items: flex-end; padding-bottom: 2px;">
          <n-checkbox
            :checked="table.oneSided"
            size="small"
            @update:checked="seatingStore.updateTable(table.id, { oneSided: $event })"
          >
            <span style="font-size: 10px; color: #94a3b8;">{{ i18n.t('one_side') }}</span>
          </n-checkbox>
        </div>
      </n-space>
    </div>

    <SeatBadge
      v-for="seat in sortedSeats"
      :key="seat.index"
      :table-id="table.id"
      :seat-index="seat.index"
      :guest-id="seat.guestId"
      @edit-guest="emit('edit-guest', $event)"
    />

    <template #action>
      <n-popconfirm @positive-click="emit('delete', table.id)">
        <template #trigger>
          <n-button size="tiny" type="error" ghost>{{ i18n.t('remove') }}</n-button>
        </template>
        {{ i18n.t('delete_table_confirm') }}
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
.print-table-info {
  display: none;
}
.print-table-name {
  display: none;
}
@media print {
  .print-table-name {
    display: block !important;
    font-weight: 600;
  }
  .print-table-info {
    display: block !important;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }
  .no-print-input, .no-print {
    display: none !important;
  }
  .n-card__action,
  :deep(.n-card__action),
  .table-dims-edit-top, 
  .n-card-header__extra,
  :deep(.n-card-header__extra) {
    display: none !important;
  }
  .n-card {
    border: 1px solid #e2e8f0 !important;
    break-inside: avoid;
    width: 100% !important;
  }
  :deep(.n-card-header) {
    padding: 8px 12px !important;
  }
  :deep(.n-card__content) {
    padding: 0 12px 8px 12px !important;
  }
  :deep(.n-card-header__main) {
    font-size: 14px !important;
  }
  :deep(.n-input), :deep(.n-input__border), :deep(.n-input__state-border) {
    border: none !important;
    box-shadow: none !important;
  }
  :deep(.n-input-wrapper) {
    padding: 0 !important;
  }
}
</style>
