<script setup lang="ts">
import { ref, computed } from 'vue'
import { NText, NInput, NIcon } from 'naive-ui'
import { Search } from 'lucide-vue-next'
import type { Guest } from '@/types'
import { useGroupStore } from '@/stores/useGroupStore'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'

const props = defineProps<{ guests: Guest[] }>()
const emit = defineEmits<{ (e: 'edit-guest', id: string): void }>()

const groupStore = useGroupStore()
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
  if (!guest.groupId) return null
  return groupStore.getById(guest.groupId)?.color ?? null
}

function onDoubleClick(guestId: string) {
  emit('edit-guest', guestId)
}
</script>

<template>
  <div class="room-guest-sidebar">
    <div style="padding: 16px 12px 0;">
      <n-text depth="2" style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px; padding: 0 4px;">
        Unassigned ({{ guests.length }})
      </n-text>
      <n-input
        v-model:value="searchQuery"
        placeholder="Search guests..."
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
          <n-text strong style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
            {{ guest.firstName }} {{ guest.lastName }}
          </n-text>
        </div>
        <RSVPBadge :status="guest.rsvpStatus" size="small" />
      </div>
      <div v-if="filteredGuests.length === 0" style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
        {{ searchQuery ? 'No matching guests' : 'All guests assigned' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-guest-sidebar {
  width: 240px;
  background: #f9fafb;
  border-right: 1px solid #efeff5;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  background: white;
  border: 1px solid #e5e7eb;
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
</style>
