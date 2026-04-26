<script setup lang="ts">
import { ref, computed } from 'vue'
import { NText, NInput, NIcon } from 'naive-ui'
import { Search } from 'lucide-vue-next'
import type { Guest } from '@/types'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import { getGroupColor } from '@/utils/guestFormatters'

const props = defineProps<{ guests: Guest[] }>()
const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const groupStore = useGroupStore()
const i18n = useI18nStore()
const searchQuery = ref('')

const filteredGuests = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return props.guests
  
  return props.guests.filter(g => 
    g.firstName.toLowerCase().includes(query) || 
    g.lastName.toLowerCase().includes(query)
  )
})

function onDragStart(event: DragEvent, guest: Guest) {
  event.dataTransfer?.setData('guestId', guest.id)
  const chip = event.currentTarget as HTMLElement
  const rect = chip.getBoundingClientRect()
  event.dataTransfer?.setDragImage(chip, event.clientX - rect.left, event.clientY - rect.top)
}

function groupColor(guest: Guest) {
  return getGroupColor(guest.groupId, groupStore.getById)
}

function onDoubleClick(guestId: string) {
  emit('edit-guest', guestId)
}
</script>

<template>
  <div class="room-guest-sidebar">
    <div style="padding: 16px 12px 0;">
      <n-text depth="2" style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px; padding: 0 4px;">
        {{ i18n.t('unassigned') }} ({{ guests.length }})
      </n-text>
      <n-input
        v-model:value="searchQuery"
        :placeholder="i18n.t('search_guests')"
        size="small"
        clearable
        style="margin-bottom: 8px;"
      >
        <template #prefix>
          <n-icon :component="Search" />
        </template>
      </n-input>
    </div>
    <div class="list-content">
      <div
        v-for="guest in filteredGuests"
        :key="guest.id"
        class="guest-chip"
        :style="groupColor(guest) ? { borderLeftColor: groupColor(guest)!, borderLeftWidth: '3px', background: groupColor(guest) + '18' } : {}"
        draggable="true"
        @dragstart="onDragStart($event, guest)"
        @dblclick="onDoubleClick(guest.id)"
      >
        <div style="display:flex; align-items:center; gap:6px; flex:1; min-width:0">
          <span
            v-if="groupColor(guest)"
            class="group-dot"
            :style="{ background: groupColor(guest)! }"
          />
          <n-text strong style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
            {{ guest.firstName }} {{ guest.lastName }}
          </n-text>
        </div>
        <RSVPBadge :status="guest.rsvpStatus" size="small" />
      </div>
      <div v-if="filteredGuests.length === 0" style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
        {{ searchQuery ? i18n.t('no_matching_guests') : i18n.t('all_guests_assigned') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-guest-sidebar {
  width: 240px;
  background: var(--bg-muted);
  border-right: 1px solid var(--border-soft);
  height: 100%;
  display: flex;
  flex-direction: column;
}
@media (max-width: 767px) {
  .room-guest-sidebar {
    width: 100%;
    height: auto;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid var(--border-soft);
  }
}

.list-content {
  padding: 8px 12px 16px;
  overflow-y: auto;
  flex: 1;
}

.guest-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.guest-chip:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.guest-chip:active {
  cursor: grabbing;
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
