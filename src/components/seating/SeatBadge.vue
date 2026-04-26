<script setup lang="ts">
import { ref, computed, watch, nextTick, h } from 'vue'
import { NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { SeatOriginCorner } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
}>()

const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const guestStore = useGuestStore()
const seatingStore = useSeatingStore()
const groupStore = useGroupStore()
const i18n = useI18nStore()

const showDropdown = ref(false)
const selectRef = ref<InstanceType<typeof NSelect> | null>(null)

watch(showDropdown, async (val) => {
  if (val) {
    await nextTick()
    setTimeout(() => {
      const input = selectRef.value?.$el?.querySelector('input')
      if (input) {
        input.focus()
      } else {
        selectRef.value?.focus()
      }
    }, 150)
  }
})

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)

const groupColor = computed(() => {
  if (!guest.value?.groupId) return null
  return groupStore.getById(guest.value.groupId)?.color ?? null
})

// ── Display seat number ───────────────────────────────────────────────────────

const displaySeatNumber = computed(() => {
  const table = seatingStore.getById(props.tableId)
  if (!table || !table.seatOriginCorner) return props.seatIndex + 1
  const n = table.seats.length
  const half = Math.ceil(n / 2)
  const corner: SeatOriginCorner = table.seatOriginCorner
  const i = props.seatIndex

  if (table.shape === 'rectangular') {
    let di: number
    if (corner === 'tl') di = i
    else if (corner === 'tr') di = i < half ? half - 1 - i : half + (n - 1 - i)
    else if (corner === 'bl') di = i >= half ? i - half : (n - half) + i
    else di = n - 1 - i
    return di + 1
  } else {
    const cornerDeg: Record<SeatOriginCorner, number> = { tl: 225, tr: 315, br: 45, bl: 135 }
    const ca = cornerDeg[corner]
    let startK = 0; let minDist = Infinity
    for (let k = 0; k < n; k++) {
      const deg = ((k / n) * 360 - 90 + 360) % 360
      let d = Math.abs(deg - ca); if (d > 180) d = 360 - d
      if (d < minDist) { minDist = d; startK = k }
    }
    return ((i - startK + n) % n) + 1
  }
})

// ── Assign dropdown ───────────────────────────────────────────────────────────

const selectOptions = computed((): (SelectOption & { color?: string | null })[] =>
  guestStore.unassignedGuests.map(g => ({
    label: `${g.firstName} ${g.lastName}`,
    value: g.id,
    color: g.groupId ? (groupStore.getById(g.groupId)?.color ?? null) : null,
  }))
)

function renderSelectLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
    h('span', {
      style: `width:10px;height:10px;border-radius:50%;flex-shrink:0;display:inline-block;background:${option.color ?? '#d1d5db'}`,
    }),
    h('span', {}, option.label as string),
  ])
}

function openDropdown() {
  if (props.guestId) return
  if (selectOptions.value.length === 0) return
  showDropdown.value = true
}

function onSelectGuest(val: string) {
  seatingStore.assignGuest(props.tableId, props.seatIndex, val)
  showDropdown.value = false
}

function onSelectUpdateShow(val: boolean) {
  if (!val) showDropdown.value = false
}

const isDragOver = ref(false)

function onDragStart(event: DragEvent) {
  if (!guest.value) return
  event.stopPropagation()
  event.dataTransfer!.setData('guestId', guest.value.id)
  event.dataTransfer!.setData('text/plain', guest.value.id) // Fallback
  event.dataTransfer!.setData('sourceTableId', props.tableId)
  event.dataTransfer!.setData('sourceSeatIndex', String(props.seatIndex))
  event.dataTransfer!.effectAllowed = 'move'
  const badge = event.currentTarget as HTMLElement
  const rect = badge.getBoundingClientRect()
  event.dataTransfer!.setDragImage(badge, event.clientX - rect.left, event.clientY - rect.top)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
  const guestId = event.dataTransfer!.getData('guestId') || event.dataTransfer!.getData('text/plain')
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

function onDoubleClick() {
  if (props.guestId) {
    emit('edit-guest', props.guestId)
  }
}
</script>

<template>
  <div class="seat-badge-wrapper">
    <div
      class="seat-badge"
      :class="{ occupied: !!guest, empty: !guest, 'is-drag-over': isDragOver }"
      :style="groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '3px', borderLeftStyle: 'solid', background: groupColor + '18' } : {}"
      :draggable="!!guest"
      @click="openDropdown"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dblclick="onDoubleClick"
    >
      <template v-if="guest">
        <span v-if="groupColor" class="group-dot" :style="{ background: groupColor }" :title="groupStore.getById(guest.groupId!)?.name" />
        <span class="guest-name">
          <strong class="seat-num-badge">{{ displaySeatNumber }}</strong>.
          {{ guest.firstName }} {{ guest.lastName }}
          <template v-if="guest.customEmoji">
            <span :title="guest.customEmoji">{{ guest.customEmoji }}</span>
          </template>
          <template v-else>
            <span v-if="guest.isGroom" title="Groom">🤵</span>
            <span v-if="guest.isBride" title="Bride">👰</span>
            <span v-if="guest.isChild" title="Child">👶</span>
          </template>
        </span>
        <button class="unassign-btn" title="Unassign" @click.stop="unassign">×</button>
      </template>
      <template v-else>
        <span class="empty-label">{{ i18n.t('seat_label').replace('{n}', String(displaySeatNumber)) }}</span>
      </template>
    </div>

    <!-- Dropdown overlay: full width of the badge, appears on top -->
    <div v-if="showDropdown" class="assign-overlay">
      <n-select
        ref="selectRef"
        :value="null"
        filterable
        :show="true"
        :options="selectOptions"
        :render-label="renderSelectLabel"
        @update:value="onSelectGuest"
        @update:show="onSelectUpdateShow"
      />
    </div>
  </div>
</template>

<style scoped>
.seat-badge-wrapper {
  position: relative;
}
.seat-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px 0;
  min-height: 26px;
  border: 1px dashed #ccc;
  cursor: pointer;
}
.occupied {
  border-style: solid;
  cursor: grab;
}
.occupied:active {
  cursor: grabbing;
}
.empty {
  background: #fafafa;
  color: #aaa;
}
.empty:hover {
  background: #f0f9ff;
  border-color: #93c5fd;
  color: #3b82f6;
}
.is-drag-over {
  background: #f0f9ff !important;
  border-color: #3b82f6 !important;
  border-style: solid !important;
}
.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  margin-right: 4px;
}
.guest-name { flex: 1; }
.seat-num-badge {
  font-size: 14px;
  margin-right: 2px;
}
.unassign-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.unassign-btn:hover { color: #e03030; }

/* Dropdown overlay: covers the badge, full width */
.assign-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  min-width: 160px;
}
@media print {
  .unassign-btn {
    display: none !important;
  }
  .seat-badge {
    border-style: solid !important;
    background-color: transparent !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color: black !important;
    font-size: 11px !important;
    padding: 1px 4px !important;
    margin: 1px 0 !important;
    min-height: 0 !important;
    height: auto !important;
  }
  .group-dot {
    width: 6px !important;
    height: 6px !important;
  }
  .seat-num-badge {
    font-size: 11px !important;
  }
}
</style>
