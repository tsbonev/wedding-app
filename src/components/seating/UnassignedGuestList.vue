<script setup lang="ts">
import { NText } from 'naive-ui'
import type { Guest } from '@/types'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'

defineProps<{ guests: Guest[] }>()

function onDragStart(event: DragEvent, guest: Guest) {
  event.dataTransfer?.setData('guestId', guest.id)
}
</script>

<template>
  <div class="unassigned-list">
    <n-text depth="2" style="font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px;">
      Unassigned ({{ guests.length }})
    </n-text>
    <div
      v-for="guest in guests"
      :key="guest.id"
      class="guest-chip"
      draggable="true"
      @dragstart="onDragStart($event, guest)"
    >
      <span>{{ guest.firstName }} {{ guest.lastName }}</span>
      <RSVPBadge :status="guest.rsvpStatus" />
    </div>
    <n-text v-if="guests.length === 0" depth="3" style="font-size: 12px;">All guests assigned 🎉</n-text>
  </div>
</template>

<style scoped>
.unassigned-list {
  width: 200px;
  flex-shrink: 0;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
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
</style>
