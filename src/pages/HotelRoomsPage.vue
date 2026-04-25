<script setup lang="ts">
import { ref } from 'vue'
import { NGrid, NGi, NCard, NSpace, NButton, NTag, NPopconfirm, NText, NTabs, NTabPane } from 'naive-ui'
import { useRoomStore } from '@/stores/useRoomStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Room, Guest } from '@/types'
import RoomFormModal from '@/components/rooms/RoomFormModal.vue'
import RoomGuestAssignModal from '@/components/rooms/RoomGuestAssignModal.vue'
import RoomAssignmentView from '@/components/rooms/RoomAssignmentView.vue'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const roomStore = useRoomStore()
const guestStore = useGuestStore()
const i18n = useI18nStore()

const activeTab = ref('list')
const showRoomModal = ref(false)
const editingRoom = ref<Room | undefined>(undefined)
const assignRoom = ref<Room | undefined>(undefined)

const showGuestModal = ref(false)
const editingGuest = ref<Guest | undefined>(undefined)

function openAdd() { editingRoom.value = undefined; showRoomModal.value = true }
function openEdit(r: Room) { editingRoom.value = r; showRoomModal.value = true }

function handleEditGuest(guestId: string) {
  const guest = guestStore.getById(guestId)
  if (guest) {
    editingGuest.value = guest
    showGuestModal.value = true
  }
}

function getGuestNames(ids: string[]) {
  return ids.map((id) => {
    const g = guestStore.getById(id)
    return g ? `${g.firstName} ${g.lastName}` : '?'
  })
}

function formatRoomType(type: string) {
  if (!type) return ''
  return i18n.t(type.toLowerCase())
}
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">{{ i18n.t('hotel_rooms') }}</h2>
      <n-button type="primary" @click="openAdd">+ {{ i18n.t('add_room') }}</n-button>
    </n-space>

    <n-tabs v-model:value="activeTab" type="segment" animated style="margin-bottom: 24px;">
      <n-tab-pane name="list" :tab="i18n.t('list_view')">
        <EmptyState
          v-if="roomStore.rooms.length === 0"
          icon="🏨"
          :title="i18n.t('no_rooms_yet')"
          :description="i18n.t('add_rooms_instruction')"
        />

        <n-grid v-else :cols="3" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
          <n-gi v-for="room in roomStore.rooms" :key="room.id" span="3 m:1">
            <n-card :title="`${i18n.t('room')} ${room.number}`">
              <template #header-extra>
                <n-tag :type="room.guestIds.length >= room.capacity ? 'error' : 'success'" size="small">
                  {{ room.guestIds.length }} / {{ room.capacity }}
                </n-tag>
              </template>

              <n-space vertical size="small">
                <n-text depth="3">{{ formatRoomType(room.type) }}</n-text>
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
                  <n-text v-if="room.guestIds.length === 0" depth="3">{{ i18n.t('no_guests_assigned') }}</n-text>
                </div>
                <div v-if="room.notes">
                  <n-text depth="3" style="font-size: 12px;">{{ room.notes }}</n-text>
                </div>
              </n-space>

              <template #action>
                <n-space>
                  <n-button size="small" @click="assignRoom = room">{{ i18n.t('assign_guests') }}</n-button>
                  <n-button size="small" @click="openEdit(room)">{{ i18n.t('edit') }}</n-button>
                  <n-popconfirm @positive-click="roomStore.deleteRoom(room.id)">
                    <template #trigger>
                      <n-button size="small" type="error" ghost>{{ i18n.t('delete') }}</n-button>
                    </template>
                    {{ i18n.t('delete_room_confirm') }}
                  </n-popconfirm>
                </n-space>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <n-tab-pane name="assignment" :tab="i18n.t('assignment_view')">
        <EmptyState
          v-if="roomStore.rooms.length === 0"
          icon="🏨"
          :title="i18n.t('no_rooms_yet')"
          :description="i18n.t('add_rooms_instruction')"
        />
        <RoomAssignmentView 
          v-else 
          @edit-guest="handleEditGuest" 
          @assign-guests="(r) => assignRoom = r"
          @edit-room="openEdit"
        />
      </n-tab-pane>
    </n-tabs>

    <RoomFormModal :show="showRoomModal" :room="editingRoom" @close="showRoomModal = false" />
    <RoomGuestAssignModal v-if="assignRoom" :show="!!assignRoom" :room="assignRoom" @close="assignRoom = undefined" />
    <GuestFormModal :show="showGuestModal" :guest="editingGuest" @close="showGuestModal = false" />
  </div>
</template>
