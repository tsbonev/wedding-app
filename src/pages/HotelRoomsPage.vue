<script setup lang="ts">
import { ref } from 'vue'
import { NGrid, NGi, NCard, NSpace, NButton, NTag, NPopconfirm, NText } from 'naive-ui'
import { useRoomStore } from '@/stores/useRoomStore'
import { useGuestStore } from '@/stores/useGuestStore'
import type { Room } from '@/types'
import RoomFormModal from '@/components/rooms/RoomFormModal.vue'
import RoomGuestAssignModal from '@/components/rooms/RoomGuestAssignModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const roomStore = useRoomStore()
const guestStore = useGuestStore()

const showRoomModal = ref(false)
const editingRoom = ref<Room | undefined>(undefined)
const assignRoom = ref<Room | undefined>(undefined)

function openAdd() { editingRoom.value = undefined; showRoomModal.value = true }
function openEdit(r: Room) { editingRoom.value = r; showRoomModal.value = true }

function getGuestNames(ids: string[]) {
  return ids.map((id) => {
    const g = guestStore.getById(id)
    return g ? `${g.firstName} ${g.lastName}` : '?'
  })
}
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">Hotel Rooms</h2>
      <n-button type="primary" @click="openAdd">+ Add Room</n-button>
    </n-space>

    <EmptyState
      v-if="roomStore.rooms.length === 0"
      icon="🏨"
      title="No rooms yet"
      description="Add hotel rooms to start assigning guests."
    />

    <n-grid v-else :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <n-gi v-for="room in roomStore.rooms" :key="room.id" span="3 m:1">
        <n-card :title="`Room ${room.number}`">
          <template #header-extra>
            <n-tag :type="room.guestIds.length >= room.capacity ? 'error' : 'success'" size="small">
              {{ room.guestIds.length }} / {{ room.capacity }}
            </n-tag>
          </template>

          <n-space vertical size="small">
            <n-text depth="3">{{ room.type }}</n-text>
            <div v-if="room.checkIn || room.checkOut">
              <n-text depth="3" style="font-size: 12px;">
                {{ room.checkIn }} → {{ room.checkOut }}
              </n-text>
            </div>
            <div>
              <n-tag
                v-for="name in getGuestNames(room.guestIds)"
                :key="name"
                size="small"
                style="margin: 2px"
              >
                {{ name }}
              </n-tag>
              <n-text v-if="room.guestIds.length === 0" depth="3">No guests assigned</n-text>
            </div>
            <div v-if="room.notes">
              <n-text depth="3" style="font-size: 12px;">{{ room.notes }}</n-text>
            </div>
          </n-space>

          <template #action>
            <n-space>
              <n-button size="small" @click="assignRoom = room">Assign Guests</n-button>
              <n-button size="small" @click="openEdit(room)">Edit</n-button>
              <n-popconfirm @positive-click="roomStore.deleteRoom(room.id)">
                <template #trigger>
                  <n-button size="small" type="error" ghost>Delete</n-button>
                </template>
                Delete this room and unassign all guests?
              </n-popconfirm>
            </n-space>
          </template>
        </n-card>
      </n-gi>
    </n-grid>

    <RoomFormModal :show="showRoomModal" :room="editingRoom" @close="showRoomModal = false" />
    <RoomGuestAssignModal v-if="assignRoom" :show="!!assignRoom" :room="assignRoom" @close="assignRoom = undefined" />
  </div>
</template>
