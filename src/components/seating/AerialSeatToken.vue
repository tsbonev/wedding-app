<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NTooltip, NPopover, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useSeatingStore } from '@/stores/useSeatingStore'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
  rotation?: number
}>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const menuStore = useMenuStore()
const seatingStore = useSeatingStore()

const showPopover = ref(false)

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)
const groupInfo = computed(() => guest.value?.groupId ? groupStore.getById(guest.value.groupId) ?? null : null)
const groupColor = computed(() => groupInfo.value?.color ?? null)
const mealOption = computed(() => {
  if (!guest.value?.mealChoiceId) return null
  return menuStore.menuOptions.find(m => m.id === guest.value!.mealChoiceId) ?? null
})

const initials = computed(() => {
  if (!guest.value) return ''
  return ((guest.value.firstName?.[0] ?? '') + (guest.value.lastName?.[0] ?? '')).toUpperCase()
})

const fullName = computed(() =>
  guest.value ? `${guest.value.firstName} ${guest.value.lastName}` : `Seat ${props.seatIndex + 1}`
)

const selectOptions = computed(() => {
  const opts: (SelectOption & { color?: string | null })[] = guestStore.unassignedGuests.map(g => ({
    label: `${g.firstName} ${g.lastName}`,
    value: g.id,
    color: g.groupId ? (groupStore.getById(g.groupId)?.color ?? null) : null,
  }))
  if (props.guestId) {
    opts.unshift({ label: '— Unassign —', value: '__unassign__', color: null })
  }
  return opts
})

function renderSelectLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
    h('span', {
      style: `width:10px;height:10px;border-radius:50%;flex-shrink:0;display:inline-block;background:${option.color ?? '#d1d5db'}`,
    }),
    h('span', {}, option.label as string),
  ])
}

const isDragOver = ref(false)

function onDragStart(event: DragEvent) {
  if (!guest.value) return
  event.dataTransfer!.setData('guestId', guest.value.id)
  event.dataTransfer!.setData('sourceTableId', props.tableId)
  event.dataTransfer!.setData('sourceSeatIndex', String(props.seatIndex))
  event.dataTransfer!.effectAllowed = 'move'
  const token = event.currentTarget as HTMLElement
  const rect = token.getBoundingClientRect()
  event.dataTransfer!.setDragImage(token, event.clientX - rect.left, event.clientY - rect.top)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const guestId = event.dataTransfer!.getData('guestId')
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

function onSelectGuest(val: string) {
  if (val === '__unassign__') {
    unassign()
  } else {
    seatingStore.assignGuest(props.tableId, props.seatIndex, val)
  }
  showPopover.value = false
}
</script>

<template>
  <n-popover v-model:show="showPopover" trigger="click" placement="top" :keep-alive-on-hover="false">
    <template #trigger>
      <n-tooltip trigger="hover" :disabled="!guest || showPopover" placement="top" :keep-alive-on-hover="false">
        <template #trigger>
          <div
            class="seat-token"
            :class="{
              'is-occupied': !!guest,
              'is-empty': !guest,
              'is-drag-over': isDragOver,
            }"
            :style="guest && groupColor ? { background: groupColor } : {}"
            :draggable="!!guest"
            @dragstart="onDragStart"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @contextmenu.prevent="unassign"
          >
            <div
              class="seat-content"
              :style="rotation ? { transform: `rotate(${-rotation}deg)` } : {}"
            >
              <span v-if="guest" class="initials">{{ initials }}</span>
              <span v-else class="seat-num">{{ seatIndex + 1 }}</span>
            </div>
          </div>
        </template>

        <div v-if="guest" class="seat-tooltip">
          <div class="tooltip-name">{{ fullName }}</div>
          <div v-if="groupInfo" class="tooltip-row">
            <span class="group-dot" :style="{ background: groupInfo.color }" />
            {{ groupInfo.name }}
          </div>
          <div v-if="mealOption" class="tooltip-row">{{ mealOption.emoji }} {{ mealOption.label }}</div>
          <div v-if="guest.dietaryNotes" class="tooltip-row tooltip-diet">{{ guest.dietaryNotes }}</div>
        </div>
      </n-tooltip>
    </template>

    <div style="width: 220px;">
      <n-select
        filterable
        :show="showPopover"
        placeholder="Assign guest…"
        :options="selectOptions"
        :render-label="renderSelectLabel"
        @update:value="onSelectGuest"
      />
    </div>
  </n-popover>
</template>

<style scoped>
.seat-token {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
  box-sizing: border-box;
  cursor: pointer;
}
.seat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}
.is-occupied {
  color: #fff;
  cursor: grab;
  border-color: transparent;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  font-size: 13px;
}
.is-occupied:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}
.is-occupied:active { cursor: grabbing; }
.is-empty {
  background: #f9fafb;
  color: #9ca3af;
  border-style: dashed;
  font-size: 10px;
}
.is-empty:hover {
  border-color: #60a5fa;
  background: #eff6ff;
  color: #3b82f6;
}
.is-drag-over.is-empty {
  border-color: #60a5fa;
  border-style: solid;
  background: #eff6ff;
  color: #3b82f6;
}
.is-drag-over.is-occupied {
  outline: 3px solid #60a5fa;
  outline-offset: 2px;
}
.initials {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  letter-spacing: 0.5px;
}

/* Tooltip */
.seat-tooltip {
  min-width: 120px;
  max-width: 200px;
}
.tooltip-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.tooltip-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  line-height: 1.6;
}
.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tooltip-diet {
  color: #9ca3af;
  font-style: italic;
}
</style>
