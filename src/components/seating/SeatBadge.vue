<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NPopover, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGroupStore } from '@/stores/useGroupStore'

const props = defineProps<{
  tableId: string
  seatIndex: number
  guestId: string | null
}>()

const guestStore = useGuestStore()
const seatingStore = useSeatingStore()
const groupStore = useGroupStore()

const showPopover = ref(false)

const guest = computed(() => props.guestId ? guestStore.getById(props.guestId) : null)

const groupColor = computed(() => {
  if (!guest.value?.groupId) return null
  return groupStore.getById(guest.value.groupId)?.color ?? null
})

const selectOptions = computed((): (SelectOption & { color?: string | null })[] =>
  guestStore.unassignedGuests.map(g => ({
    label: `${g.firstName} ${g.lastName}`,
    value: g.id,
    color: g.groupId ? (groupStore.getById(g.groupId)?.color ?? null) : null,
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

function onDrop(event: DragEvent) {
  event.preventDefault()
  const guestId = event.dataTransfer?.getData('guestId')
  if (guestId) seatingStore.assignGuest(props.tableId, props.seatIndex, guestId)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

function unassign() {
  if (props.guestId) seatingStore.unassignGuest(props.guestId)
}

function onSelectGuest(val: string) {
  seatingStore.assignGuest(props.tableId, props.seatIndex, val)
  showPopover.value = false
}
</script>

<template>
  <n-popover v-model:show="showPopover" trigger="click" placement="top" :keep-alive-on-hover="false">
    <template #trigger>
      <div
        class="seat-badge"
        :class="{ occupied: !!guest, empty: !guest }"
        :style="groupColor ? { borderLeftColor: groupColor, borderLeftWidth: '3px', borderLeftStyle: 'solid', background: groupColor + '18' } : {}"
        @drop="onDrop"
        @dragover="onDragOver"
      >
        <template v-if="guest">
          <span v-if="groupColor" class="group-dot" :style="{ background: groupColor }" :title="groupStore.getById(guest.groupId!)?.name" />
          <span class="guest-name">{{ guest.firstName }} {{ guest.lastName[0] }}.</span>
          <button class="unassign-btn" title="Unassign" @click.stop="unassign">×</button>
        </template>
        <template v-else>
          <span class="empty-label">Seat {{ seatIndex + 1 }}</span>
        </template>
      </div>
    </template>

    <div style="width: 220px;">
      <n-select
        filterable
        :show="showPopover"
        placeholder="Assign guest…"
        :options="selectOptions"
        :render-label="renderSelectLabel"
        @update:value="onSelectGuest"
      />
    </div>
  </n-popover>
</template>

<style scoped>
.seat-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 2px 0;
  min-height: 26px;
  border: 1px dashed #ccc;
  cursor: pointer;
}
.occupied {
  border-color: #86efac;
  border-style: solid;
}
.empty {
  background: #fafafa;
  color: #aaa;
}
.empty:hover {
  background: #f0f9ff;
  border-color: #93c5fd;
  color: #3b82f6;
}
.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  margin-right: 4px;
}
.guest-name { flex: 1; }
.unassign-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.unassign-btn:hover { color: #e03030; }
</style>
