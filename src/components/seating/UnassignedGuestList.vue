<script setup lang="ts">
import { NText, NCheckbox } from 'naive-ui'
import type { Guest } from '@/types'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'

defineProps<{ guests: Guest[] }>()
const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const groupStore = useGroupStore()
const configStore = useAppConfigStore()

function onResizeStart(event: MouseEvent) {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = configStore.guestSidebarWidth

  function onMove(e: MouseEvent) {
    configStore.guestSidebarWidth = Math.max(160, Math.min(500, startWidth + (startX - e.clientX)))
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onDragStart(event: DragEvent, guest: Guest) {
  event.dataTransfer?.setData('guestId', guest.id)
  const chip = event.currentTarget as HTMLElement
  const rect = chip.getBoundingClientRect()
  event.dataTransfer?.setDragImage(chip, event.clientX - rect.left, event.clientY - rect.top)
}

function groupColor(guest: Guest) {
  if (!guest.groupId) return null
  return groupStore.getById(guest.groupId)?.color ?? null
}

function onDoubleClick(guestId: string) {
  emit('edit-guest', guestId)
}
</script>

<template>
  <div class="unassigned-list" :style="{ width: configStore.guestSidebarWidth + 'px' }">
    <div class="resize-handle" @mousedown="onResizeStart" />
    <div class="list-content">
      <n-text depth="2" style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px;">
        Unassigned ({{ guests.length }})
      </n-text>
      <div
        v-for="guest in guests"
        :key="guest.id"
        class="guest-chip"
        :style="groupColor(guest) ? { borderLeftColor: groupColor(guest)!, borderLeftWidth: '3px' } : {}"
        draggable="true"
        @dragstart="onDragStart($event, guest)"
        @dblclick="onDoubleClick(guest.id)"
      >
        <div style="display:flex; align-items:center; gap:5px; flex:1; min-width:0">
          <span
            v-if="groupColor(guest)"
            :style="`width:8px; height:8px; border-radius:50%; background:${groupColor(guest)}; flex-shrink:0`"
          />
          <span class="guest-name">{{ guest.firstName }} {{ guest.lastName }}</span>
        </div>
        <RSVPBadge :status="guest.rsvpStatus" />
      </div>
      <n-text v-if="guests.length === 0" depth="3" style="font-size: 12px;">All guests assigned 🎉</n-text>
    </div>
  </div>
</template>

<style scoped>
.unassigned-list {
  flex-shrink: 0;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  max-height: calc(100vh - 120px);
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 12px 14px;
}
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  border-radius: 3px 0 0 3px;
  background: transparent;
  transition: background 0.15s;
}
.resize-handle:hover { background: rgba(59, 130, 246, 0.35); }
.guest-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  cursor: grab;
  gap: 6px;
}
.guest-chip:hover { background: #f0f9ff; border-color: #93c5fd; }
.guest-chip:active { cursor: grabbing; }
.guest-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-footer {
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid #eee;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}
</style>
