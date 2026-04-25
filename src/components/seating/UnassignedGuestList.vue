<script setup lang="ts">
import { NText } from 'naive-ui'
import type { Guest } from '@/types'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'

import { useGuestStore } from '@/stores/useGuestStore'

defineProps<{ guests: Guest[] }>()
const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const configStore = useAppConfigStore()

function onResizeStart(event: MouseEvent) {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = configStore.guestSidebarWidth

  function onMove(e: MouseEvent) {
    // Reverse the calculation because the handle is on the LEFT side of the drawer
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
  if (configStore.isLinkingMode) {
    configStore.activeLinkingSource = guest.id
    // Set transparent drag image
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    event.dataTransfer?.setDragImage(img, 0, 0)
  } else {
    const chip = event.currentTarget as HTMLElement
    const rect = chip.getBoundingClientRect()
    event.dataTransfer?.setDragImage(chip, event.clientX - rect.left, event.clientY - rect.top)
  }
}

function onDragEnd() {
  configStore.activeLinkingSource = null
}

function onDragOver(event: DragEvent) {
  if (configStore.isLinkingMode) {
    event.preventDefault()
  }
}

function onDrop(event: DragEvent, targetGuest: Guest) {
  if (!configStore.isLinkingMode) return
  event.preventDefault()
  const guestId = event.dataTransfer?.getData('guestId')
  if (guestId && guestId !== targetGuest.id) {
    if (configStore.linkingModeType === 'partner') {
      guestStore.updateGuest(guestId, { partnerId: targetGuest.id })
    } else if (configStore.linkingModeType === 'child') {
      guestStore.updateGuest(guestId, { isChild: true, parentId: targetGuest.id })
    }
  }
  configStore.activeLinkingSource = null
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
  <Transition name="slide">
    <div 
      v-if="configStore.isGuestSidebarOpen"
      class="unassigned-list" 
      :style="{ width: configStore.guestSidebarWidth + 'px' }"
    >
      <div class="resize-handle" @mousedown="onResizeStart" />
      <div class="list-content">
        <n-text depth="2" style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px;">
          Unassigned ({{ guests.length }})
        </n-text>
        <div
          v-for="guest in guests"
          :key="guest.id"
          class="guest-chip"
          :data-guest-id="guest.id"
          :style="groupColor(guest) ? { borderLeftColor: groupColor(guest)!, borderLeftWidth: '3px' } : {}"
          draggable="true"
          @dragstart="onDragStart($event, guest)"
          @dragend="onDragEnd"
          @dragover="onDragOver"
          @drop="onDrop($event, guest)"
          @dblclick="onDoubleClick(guest.id)"
        >
          <div style="display:flex; align-items:center; gap:5px; flex:1; min-width:0">
            <span
              v-if="groupColor(guest)"
              :style="`width:8px; height:8px; border-radius:50%; background:${groupColor(guest)}; flex-shrink:0`"
            />
            <span class="guest-name">{{ guest.firstName }} {{ guest.lastName }}</span>
            <template v-if="guest.customEmoji">
              <span :title="guest.customEmoji">{{ guest.customEmoji }}</span>
            </template>
            <template v-else>
              <span v-if="guest.isGroom" title="Groom">🤵</span>
              <span v-if="guest.isBride" title="Bride">👰</span>
              <span v-if="guest.isChild" title="Child">👶</span>
            </template>
          </div>
          <RSVPBadge :status="guest.rsvpStatus" />
        </div>
        <n-text v-if="guests.length === 0" depth="3" style="font-size: 12px;">All guests assigned 🎉</n-text>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.unassigned-list {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  background: white;
  border-left: 1px solid #e2e8f0;
  box-shadow: -4px 0 15px -3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
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
