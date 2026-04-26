<script setup lang="ts">
import { ref, computed, watch, nextTick, h } from 'vue'
import { NTooltip, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { MenuItem } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { getDisplaySeatNumber } from '@/utils/seatNumber'
import { getGroupColor } from '@/utils/guestFormatters'

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
const childrenGuests = computed(() => {
  if (!props.guestId) return []
  return guestStore.guests.filter(g => g.parentId === props.guestId && g.isChildrenSeatAdjoining && (g.tableId === props.tableId || g.tableId === null))
})
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
  guest.value ? `${guest.value.firstName} ${guest.value.lastName}` : i18n.t('seat_label').replace('{n}', String(displaySeatNumber.value))
)

const displaySeatNumber = computed(() => {
  const table = seatingStore.getById(props.tableId)
  if (!table) return props.seatIndex + 1
  return getDisplaySeatNumber(table, props.seatIndex)
})

// ── Assign dropdown ───────────────────────────────────────────────────────────

const selectOptions = computed((): (SelectOption & { color?: string | null })[] =>
  guestStore.unassignedGuests.map(g => ({
    label: `${g.firstName} ${g.lastName}`,
    value: g.id,
    color: getGroupColor(g.groupId, groupStore.getById),
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
        <div v-if="!guest?.isChildrenSeatAdjoining" class="seat-token-group">
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

          <!-- Adjoining children badges -->
          <n-tooltip
            v-for="(child, idx) in childrenGuests"
            :key="child.id"
            trigger="hover"
            placement="top"
          >
            <template #trigger>
              <div
                class="adjoining-child-badge"
                :class="`pos-${idx % 4}`"
                :style="{
                  background: getGroupColor(child.groupId, groupStore.getById) ?? '#3b82f6',
                  transform: rotation ? `rotate(${-rotation}deg)` : ''
                }"
                @dblclick.stop="emit('edit-guest', child.id)"
              >
                <div class="adjoining-child-content">
                  <span v-if="child.customEmoji" class="adjoining-emoji">{{ child.customEmoji }}</span>
                  <span v-else class="adjoining-emoji">👶</span>
                  <span class="adjoining-initials">{{ child.firstName[0] }}{{ child.lastName[0] }}</span>
                </div>
              </div>
            </template>
            <div class="seat-tooltip">
              <div class="tooltip-name">{{ child.firstName }} {{ child.lastName }}</div>
              <div v-if="child.groupId" class="tooltip-row">
                <span class="group-dot" :style="{ background: groupStore.getById(child.groupId)?.color }" />
                {{ groupStore.getById(child.groupId)?.name }}
              </div>
              <div v-if="child.mealChoiceId" class="tooltip-row">
                {{ menuStore.menuOptions.find(m => m.id === child.mealChoiceId)?.emoji }}
                {{ menuStore.menuOptions.find(m => m.id === child.mealChoiceId)?.label }}
              </div>
              <div v-if="child.dietaryNotes" class="tooltip-row tooltip-diet">{{ child.dietaryNotes }}</div>
            </div>
          </n-tooltip>
        </div>
        <div v-else-if="guest?.isChildrenSeatAdjoining" class="adjoining-placeholder">
          <span class="seat-num">{{ displaySeatNumber }}</span>
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
.seat-token-group {
  position: relative;
}
.seat-token-group:hover .seat-token {
  z-index: 10;
}
.seat-token {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--seat-border);
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
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.is-occupied:hover {
  transform: scale(1.1) rotate(calc(v-bind('rotation || 0') * -1deg));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}
.is-occupied:active { cursor: grabbing; }
.is-empty {
  background: var(--bg-muted);
  color: var(--text-muted);
  border-style: dashed;
  font-size: 10px;
}
.is-empty:hover {
  border-color: #60a5fa;
  background: var(--bg-hover-blue);
  color: #3b82f6;
}
.is-drag-over.is-empty {
  border-color: #60a5fa;
  border-style: solid;
  background: var(--bg-hover-blue);
  color: #3b82f6;
}
.is-drag-over.is-occupied {
  outline: 3px solid #60a5fa;
  outline-offset: 2px;
}
.initials {
  letter-spacing: 0.5px;
}
.adjoining-child-badge {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.25);
  cursor: pointer;
  pointer-events: auto;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.adjoining-child-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.adjoining-emoji {
  font-size: 13px;
  margin-bottom: -1px;
}
.adjoining-initials {
  font-size: 8px;
  font-weight: bold;
  color: #fff;
}
.adjoining-child-badge.pos-0 { bottom: -4px; right: -4px; }
.adjoining-child-badge.pos-1 { top: -4px; left: -4px; }
.adjoining-child-badge.pos-2 { bottom: -4px; left: -4px; }
.adjoining-child-badge.pos-3 { top: -4px; right: -4px; }

.adjoining-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px dashed var(--seat-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.5;
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
.tooltip-diet { color: var(--text-muted); font-style: italic; }
</style>
