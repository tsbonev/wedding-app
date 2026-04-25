<script setup lang="ts">
import { ref, computed, watch, nextTick, h } from 'vue'
import { NTooltip, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { SeatOriginCorner, MenuItem } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
  rotation?: number
}>()

const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const menuStore = useMenuStore()
const seatingStore = useSeatingStore()
const configStore = useAppConfigStore()

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
const groupInfo = computed(() => guest.value?.groupId ? groupStore.getById(guest.value.groupId) ?? null : null)
const groupColor = computed(() => groupInfo.value?.color ?? null)
const mealOption = computed(() => {
  if (!guest.value?.mealChoiceId) return null
  return menuStore.menuOptions.find((m: MenuItem) => m.id === guest.value!.mealChoiceId) ?? null
})

const initials = computed(() => {
  if (!guest.value) return ''
  return ((guest.value.firstName?.[0] ?? '') + (guest.value.lastName?.[0] ?? '')).toUpperCase()
})

const fullName = computed(() =>
  guest.value ? `${guest.value.firstName} ${guest.value.lastName}` : `Seat ${props.seatIndex + 1}`
)

// ── Display seat number based on origin corner ────────────────────────────────

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
  if (configStore.isLinkingMode) return
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

// ── Drag and drop ─────────────────────────────────────────────────────────────

const isDragOver = ref(false)

function onDragStart(event: DragEvent) {
  if (!guest.value) return
  event.dataTransfer!.setData('guestId', guest.value.id)
  event.dataTransfer!.setData('sourceTableId', props.tableId)
  event.dataTransfer!.setData('sourceSeatIndex', String(props.seatIndex))
  event.dataTransfer!.effectAllowed = 'move'

  if (configStore.isLinkingMode) {
    configStore.activeLinkingSource = guest.value.id
    // Set transparent drag image
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    event.dataTransfer!.setDragImage(img, 0, 0)
  } else {
    const token = event.currentTarget as HTMLElement
    const rect = token.getBoundingClientRect()
    event.dataTransfer!.setDragImage(token, event.clientX - rect.left, event.clientY - rect.top)
  }
}

function onDragEnd() {
  configStore.activeLinkingSource = null
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

  if (configStore.isLinkingMode) {
    // Linking Mode: 
    if (props.guestId && props.guestId !== guestId) {
      if (configStore.linkingModeType === 'partner') {
        guestStore.updateGuest(guestId, { partnerId: props.guestId })
      } else if (configStore.linkingModeType === 'child') {
        guestStore.updateGuest(guestId, { isChild: true, parentId: props.guestId })
      }
    }
    configStore.activeLinkingSource = null
    return
  }

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
  <div class="seat-wrapper">
    <n-tooltip trigger="hover" :disabled="!guest || showDropdown" placement="top" :keep-alive-on-hover="false">
      <template #trigger>
        <div
          class="seat-token"
          :class="{
            'is-occupied': !!guest,
            'is-empty': !guest,
            'is-drag-over': isDragOver,
          }"
          :data-guest-id="guestId"
          :style="[
            guest && groupColor ? { background: groupColor } : {},
            rotation ? { transform: `rotate(${-rotation}deg)` } : {}
          ]"
          :draggable="!!guest"
          :title="configStore.isLinkingMode && guest ? 'Drag onto someone to set a relation' : ''"
          @click="openDropdown"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @dblclick="onDoubleClick"
          @contextmenu.prevent="unassign"
        >
          <div class="seat-content">
            <template v-if="guest?.customEmoji">
              <div class="special-role-crown">{{ guest.customEmoji }}</div>
            </template>
            <template v-else-if="guest">
              <div v-if="guest.isGroom || guest.isBride" class="special-role-crown">👑</div>
              <div v-if="guest.isChild" class="special-role-crown">👶</div>
            </template>
            <div v-if="guest" class="seat-guest-info">
              <span class="initials">{{ initials }}</span>
            </div>
            <span v-else class="seat-num">{{ displaySeatNumber }}</span>
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

    <!-- Dropdown overlay: appears on top of the token, anchors NSelect for positioning -->
    <div
      v-if="showDropdown"
      class="assign-overlay"
      :style="rotation ? { transform: `translateX(-50%) rotate(${-rotation}deg)` } : {}"
    >
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
.seat-wrapper {
  position: relative;
  display: inline-flex;
}
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
}
.special-role-crown {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  pointer-events: none;
}
.is-occupied {
  color: #fff;
  cursor: grab;
  border-color: transparent;
  font-size: 13px;
}
.is-occupied:hover {
  transform: scale(1.1) rotate(calc(v-bind('rotation || 0') * -1deg));
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
  letter-spacing: 0.5px;
}
.seat-guest-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.seat-num-small {
  font-size: 11px;
  opacity: 1;
  font-weight: 700;
  margin-bottom: -1px;
}

/* Dropdown overlay — centered on the token, wide enough for names */
.assign-overlay {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  z-index: 100;
}

/* Tooltip */
.seat-tooltip { min-width: 120px; max-width: 200px; }
.tooltip-name { font-weight: 600; margin-bottom: 4px; }
.tooltip-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  line-height: 1.6;
}
.group-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tooltip-diet { color: #9ca3af; font-style: italic; }
</style>
