<script setup lang="ts">
import { ref } from 'vue'
import { NGrid, NGi, NCard, NSpace, NTag, NText, NScrollbar, NButton, NIcon } from 'naive-ui'
import { UserPlus, Edit } from 'lucide-vue-next'
import { useRoomStore } from '@/stores/useRoomStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Room, Guest } from '@/types'
import RoomGuestList from './RoomGuestList.vue'

const roomStore = useRoomStore()
const guestStore = useGuestStore()
const i18n = useI18nStore()

const isOverRoomId = ref<string | null>(null)

function onDragOver(event: DragEvent, roomId: string) {
  event.preventDefault()
  isOverRoomId.value = roomId
}

function onDragLeave() {
  isOverRoomId.value = null
}

function onDrop(event: DragEvent, room: Room) {
  event.preventDefault()
  isOverRoomId.value = null
  const guestId = event.dataTransfer?.getData('guestId')
  if (guestId) {
    // If guest is already in this room, do nothing
    if (room.guestIds.includes(guestId)) return
    
    // Assign guest to room
    roomStore.assignGuests(room.id, [guestId])
  }
}

function unassign(guestId: string) {
  roomStore.unassignGuest(guestId)
}

function getGuest(id: string): Guest | undefined {
  return guestStore.getById(id)
}

function formatRoomType(type: string) {
  if (!type) return ''
  return i18n.t(type.toLowerCase())
}

const emit = defineEmits<{ 
  (e: 'edit-guest', id: string): void;
  (e: 'assign-guests', room: Room): void;
  (e: 'edit-room', room: Room): void;
}>()
</script>

<template>
  <div class="room-assignment-container">
    <RoomGuestList 
      :guests="guestStore.unassignedRoomGuests" 
      @edit-guest="(id) => emit('edit-guest', id)"
    />
    
    <div class="assignment-canvas">
      <n-scrollbar>
        <div style="padding: 24px;">
          <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
            <n-gi v-for="room in roomStore.rooms" :key="room.id" span="3 m:1">
              <div
                class="room-drop-zone"
                :class="{ 'is-over': isOverRoomId === room.id, 'is-full': room.guestIds.length >= room.capacity }"
                @dragover="onDragOver($event, room.id)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, room)"
              >
                <n-card :title="`${i18n.t('room')} ${room.number}`" size="small" :bordered="false">
                  <template #header-extra>
                    <n-space align="center" :size="4">
                      <n-button quaternary circle size="tiny" @click="emit('assign-guests', room)">
                        <template #icon><n-icon :component="UserPlus" /></template>
                      </n-button>
                      <n-button quaternary circle size="tiny" @click="emit('edit-room', room)">
                        <template #icon><n-icon :component="Edit" /></template>
                      </n-button>
                      <n-tag :type="room.guestIds.length >= room.capacity ? 'error' : 'success'" size="small">
                        {{ room.guestIds.length }} / {{ room.capacity }}
                      </n-tag>
                    </n-space>
                  </template>

                  <n-space vertical size="small">
                    <n-text depth="3" style="font-size: 12px;">{{ formatRoomType(room.type) }}</n-text>
                    
                    <div class="assigned-guests-list">
                      <div
                        v-for="gid in room.guestIds"
                        :key="gid"
                        class="assigned-guest-tag"
                      >
                        <span class="guest-name">
                          {{ getGuest(gid)?.firstName }} {{ getGuest(gid)?.lastName }}
                        </span>
                        <button class="unassign-btn" @click="unassign(gid)">×</button>
                      </div>
                      <div v-if="room.guestIds.length === 0" class="empty-placeholder">
                        {{ i18n.t('drop_guests_here') }}
                      </div>
                    </div>
                  </n-space>
                </n-card>
              </div>
            </n-gi>
          </n-grid>
        </div>
      </n-scrollbar>
    </div>
  </div>
</template>

<style scoped>
.room-assignment-container {
  display: flex;
  height: calc(100vh - 180px); /* Adjust based on header/tabs */
  background: white;
  border: 1px solid #efeff5;
  border-radius: 8px;
  overflow: hidden;
}

.assignment-canvas {
  flex: 1;
  background: #f3f4f6;
  position: relative;
}

.room-drop-zone {
  height: 100%;
  border: 2px dashed transparent;
  border-radius: 12px;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.room-drop-zone.is-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
  z-index: 10;
}

.room-drop-zone.is-full.is-over {
  border-color: #ef4444;
  background: #fef2f2;
}

.assigned-guests-list {
  min-height: 80px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  margin-top: 4px;
}

.assigned-guest-tag {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
}

.guest-name {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unassign-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  margin-left: 4px;
  padding: 0 2px;
  font-size: 14px;
  line-height: 1;
}

.unassign-btn:hover {
  color: #ef4444;
}

.empty-placeholder {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-style: italic;
  font-size: 13px;
}
</style>
