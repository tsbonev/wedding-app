<script setup lang="ts">
import { ref } from 'vue'
import { NGrid, NGi, NCard, NSpace, NButton, NTag, NPopconfirm, NText, NTabs, NTabPane } from 'naive-ui'
import { useRoomStore } from '@/stores/useRoomStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Room, Guest } from '@/types'
import RoomFormModal from '@/components/rooms/RoomFormModal.vue'
import RoomGuestAssignModal from '@/components/rooms/RoomGuestAssignModal.vue'
import RoomAssignmentView from '@/components/rooms/RoomAssignmentView.vue'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const roomStore = useRoomStore()
const guestStore = useGuestStore()
const groupStore = useGroupStore()
const configStore = useAppConfigStore()
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

function getGuests(ids: string[]) {
  return ids.map((id) => guestStore.getById(id)).filter(Boolean) as Guest[]
}

function getGroupColor(guest: Guest) {
  if (!guest.groupId) return null
  return groupStore.getById(guest.groupId)?.color ?? null
}

function formatRoomType(type: string) {
  if (!type) return ''
  return i18n.t(type.toLowerCase())
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div>
    <!-- Print-only header -->
    <div class="print-header">
      <h1 v-if="configStore.coupleName">{{ configStore.coupleName }}</h1>
      <div class="print-meta">
        <span v-if="configStore.weddingDate"><strong>{{ i18n.t('date') }}:</strong> {{ configStore.weddingDate }}</span>
        <span v-if="configStore.venue"><strong>{{ i18n.t('venue_label') }}:</strong> {{ configStore.venue }}</span>
      </div>
      <h2 style="margin-top: 10px;">{{ i18n.t('hotel_rooms') }}</h2>
    </div>

    <n-space justify="space-between" align="center" style="margin-bottom: 16px;" class="no-print">
      <h2 style="margin: 0;">{{ i18n.t('hotel_rooms') }}</h2>
      <n-space>
        <n-button type="info" secondary @click="handlePrint">🖨️ {{ i18n.t('print') }}</n-button>
        <n-button type="primary" @click="openAdd">+ {{ i18n.t('add_room') }}</n-button>
      </n-space>
    </n-space>

    <n-tabs v-model:value="activeTab" type="segment" animated style="margin-bottom: 24px;">
      <n-tab-pane name="list" :tab="i18n.t('list_view')" class="print-content">
        <EmptyState
          v-if="roomStore.rooms.length === 0"
          icon="🏨"
          :title="i18n.t('no_rooms_yet')"
          :description="i18n.t('add_rooms_instruction')"
        />

        <n-grid v-else :cols="4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <n-gi v-for="room in roomStore.sortedRooms" :key="room.id" span="4 m:1">
            <n-card :title="`${i18n.t('room')} ${room.number}`" size="small">
              <template #header-extra>
                <div class="no-print">
                  <n-tag :type="room.guestIds.length >= room.capacity ? 'error' : 'success'" size="small">
                    {{ room.guestIds.length }} / {{ room.capacity }}
                  </n-tag>
                </div>
              </template>

              <n-space vertical :size="4">
                <n-text depth="3" style="font-size: 12px;">{{ formatRoomType(room.type) }}</n-text>
                <div v-if="room.checkIn || room.checkOut">
                  <n-text depth="3" style="font-size: 11px;">
                    {{ room.checkIn }} → {{ room.checkOut }}
                  </n-text>
                </div>
                <div>
                  <div
                    v-for="guest in getGuests(room.guestIds)"
                    :key="guest.id"
                    class="guest-tag"
                    :style="getGroupColor(guest) ? { borderLeftColor: getGroupColor(guest)!, background: getGroupColor(guest) + '18' } : {}"
                  >
                    <span v-if="getGroupColor(guest)" class="group-dot" :style="{ background: getGroupColor(guest)! }" />
                    <span class="guest-name">{{ guest.firstName }} {{ guest.lastName }}</span>
                  </div>
                  <n-text v-if="room.guestIds.length === 0" depth="3" style="font-size: 11px;">{{ i18n.t('no_guests_assigned') }}</n-text>
                </div>
                <div v-if="room.notes">
                  <n-text depth="3" style="font-size: 11px;">{{ room.notes }}</n-text>
                </div>
              </n-space>

              <template #action>
                <div class="no-print">
                  <n-space size="small">
                    <n-button size="tiny" @click="openEdit(room)">{{ i18n.t('edit') }}</n-button>
                    <n-popconfirm @positive-click="roomStore.deleteRoom(room.id)">
                      <template #trigger>
                        <n-button size="tiny" type="error" ghost>{{ i18n.t('delete') }}</n-button>
                      </template>
                      {{ i18n.t('delete_room_confirm') }}
                    </n-popconfirm>
                  </n-space>
                </div>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <n-tab-pane name="assignment" :tab="i18n.t('assignment_view')" class="no-print">
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

    <RoomFormModal :show="showRoomModal" :room="editingRoom" @close="showRoomModal = false" class="no-print" />
    <RoomGuestAssignModal v-if="assignRoom" :show="!!assignRoom" :room="assignRoom" @close="assignRoom = undefined" class="no-print" />
    <GuestFormModal :show="showGuestModal" :guest="editingGuest" @close="showGuestModal = false" class="no-print" />
  </div>
</template>

<style scoped>
.guest-tag {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px 0;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}
.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  margin-right: 6px;
}
.guest-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 1cm;
  }
  
  .no-print {
    display: none !important;
  }

  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
  }
  .print-header h1 {
    margin: 0 0 5px 0;
    font-size: 24px;
    color: #334155;
  }
  .print-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 14px;
    color: #64748b;
  }

  /* Force the list view to be visible during print even if another tab is active */
  .n-tabs-nav, :deep(.n-tabs-nav) {
    display: none !important;
  }
  
  .n-tab-pane:not(.print-content) {
    display: none !important;
  }

  .print-content {
    display: block !important;
  }

  :deep(.n-card > .n-card__action) {
    display: none !important;
  }

  :deep(.n-grid) {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
  }

  :deep(.n-card__content) {
    padding: 8px !important;
  }

  :deep(.n-card-header) {
    padding: 8px !important;
  }

  :deep(.n-card-header__main) {
    font-size: 14px !important;
  }

  :deep(.n-gi) {
    grid-column: span 1 !important;
  }

  .guest-tag {
    border: 1px solid #ddd !important;
    background-color: transparent !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

.print-header {
  display: none;
}
</style>
