<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NButton, NSpace, NInput, NSelect, NDataTable, NTag, NPopconfirm, NText
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import type { Guest } from '@/types'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const guestStore = useGuestStore()
const menuStore = useMenuStore()

const showModal = ref(false)
const editingGuest = ref<Guest | undefined>(undefined)
const search = ref('')
const rsvpFilter = ref('')

const rsvpFilterOptions = [
  { label: 'All', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Declined', value: 'declined' },
]

const filtered = computed(() => {
  let list = [...guestStore.guests]
  if (rsvpFilter.value) list = list.filter((g) => g.rsvpStatus === rsvpFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      (g.email ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

function openAdd() {
  editingGuest.value = undefined
  showModal.value = true
}
function openEdit(guest: Guest) {
  editingGuest.value = guest
  showModal.value = true
}

function getMealLabel(id: string | null) {
  if (!id) return '—'
  const opt = menuStore.menuOptions.find((o) => o.id === id)
  return opt ? `${opt.emoji} ${opt.label}` : '—'
}

function getPlusOneLabel(id: string | null) {
  if (!id) return null
  const g = guestStore.getById(id)
  return g ? `+1 of ${g.firstName} ${g.lastName}` : null
}

const columns: DataTableColumns<Guest> = [
  {
    title: 'Name',
    key: 'name',
    render: (row) => {
      const plusOne = getPlusOneLabel(row.plusOneOf)
      return h(NSpace, { vertical: true, size: 2 }, {
        default: () => [
          h('span', `${row.firstName} ${row.lastName}`),
          plusOne ? h(NText, { depth: 3, style: 'font-size:11px' }, { default: () => plusOne }) : null,
        ],
      })
    },
  },
  {
    title: 'RSVP',
    key: 'rsvpStatus',
    width: 110,
    render: (row) => h(RSVPBadge, { status: row.rsvpStatus }),
  },
  {
    title: 'Meal',
    key: 'meal',
    width: 120,
    render: (row) => getMealLabel(row.mealChoiceId),
  },
  {
    title: 'Table',
    key: 'tableId',
    width: 90,
    render: (row) => row.tableId ? h(NTag, { size: 'small' }, { default: () => '💺 Assigned' }) : '—',
  },
  {
    title: 'Room',
    key: 'roomId',
    width: 90,
    render: (row) => row.roomId ? h(NTag, { size: 'small' }, { default: () => '🏨 Assigned' }) : '—',
  },
  {
    title: '',
    key: 'actions',
    width: 100,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => 'Edit' }),
          h(NPopconfirm, {
            onPositiveClick: () => guestStore.deleteGuest(row.id),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { default: () => 'Delete' }),
            default: () => 'Delete this guest and their plus-ones?',
          }),
        ],
      }),
  },
]
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">Guests</h2>
      <n-button type="primary" @click="openAdd">+ Add Guest</n-button>
    </n-space>

    <n-space style="margin-bottom: 16px;">
      <n-input v-model:value="search" placeholder="Search name or email…" clearable style="width: 220px" />
      <n-select
        v-model:value="rsvpFilter"
        :options="rsvpFilterOptions"
        style="width: 140px"
        placeholder="Filter RSVP"
      />
    </n-space>

    <EmptyState
      v-if="guestStore.guests.length === 0"
      icon="👥"
      title="No guests yet"
      description="Click 'Add Guest' to start building your guest list."
    />

    <n-data-table
      v-else
      :columns="columns"
      :data="filtered"
      :row-key="(row: Guest) => row.id"
      :pagination="{ pageSize: 20 }"
      striped
    />

    <GuestFormModal
      :show="showModal"
      :guest="editingGuest"
      @close="showModal = false"
    />
  </div>
</template>
