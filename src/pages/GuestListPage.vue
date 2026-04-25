<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NButton, NSpace, NInput, NSelect, NDataTable, NTag, NPopconfirm, NText
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import type { Guest, RSVPStatus } from '@/types'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import BulkAddModal from '@/components/guest/BulkAddModal.vue'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const guestStore = useGuestStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()

// ── Filters ───────────────────────────────────────────────────────────────────

const showModal = ref(false)
const showBulkModal = ref(false)
const editingGuest = ref<Guest | undefined>(undefined)
const search = ref('')
const rsvpFilter = ref('')
const groupFilter = ref('')

const rsvpFilterOptions = [
  { label: 'All RSVP', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Declined', value: 'declined' },
]

const groupFilterOptions = computed(() => [
  { label: 'All Groups', value: '' },
  ...groupStore.groups.map((g) => ({ label: g.name, value: g.id })),
])

const filtered = computed(() => {
  let list = [...guestStore.guests]
  if (rsvpFilter.value) list = list.filter((g) => g.rsvpStatus === rsvpFilter.value)
  if (groupFilter.value) list = list.filter((g) => g.groupId === groupFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Inline editing ────────────────────────────────────────────────────────────

type EditField = 'name' | 'group' | 'rsvp' | 'meal'
const editingCell = ref<{ id: string; field: EditField } | null>(null)
// Controlled open state for the active dropdown — drives `show` directly so
// the menu opens on the first click without needing a second click.
const selectOpen = ref(false)

const editFirst = ref('')
const editLast = ref('')

function isEditing(id: string, field: EditField) {
  return editingCell.value?.id === id && editingCell.value?.field === field
}

function startSelectEdit(id: string, field: EditField) {
  editingCell.value = { id, field }
  selectOpen.value = true
}

function closeSelect() {
  selectOpen.value = false
  editingCell.value = null
}

function startNameEdit(row: Guest) {
  editFirst.value = row.firstName
  editLast.value = row.lastName
  editingCell.value = { id: row.id, field: 'name' }
}

function saveName(id: string) {
  if (editFirst.value.trim()) {
    guestStore.updateGuest(id, {
      firstName: editFirst.value.trim(),
      lastName: editLast.value.trim(),
    })
  }
  editingCell.value = null
}

function cancelEdit() {
  editingCell.value = null
  selectOpen.value = false
}

// ── Select options ────────────────────────────────────────────────────────────

const rsvpCellOptions = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Declined', value: 'declined' },
]

const mealCellOptions = computed(() => [
  { label: '— None —', value: '' },
  ...menuStore.menuOptions.map((o) => ({ label: `${o.emoji} ${o.label}`, value: o.id })),
])

const groupCellOptions = computed<(SelectOption & { color?: string })[]>(() => [
  { label: '— None —', value: '' },
  ...groupStore.groups.map((g) => ({ label: g.name, value: g.id, color: g.color })),
])

function renderGroupLabel(option: SelectOption & { color?: string }) {
  if (!option.color) return h('span', String(option.label))
  return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
    h('span', { style: `width:10px;height:10px;border-radius:50%;background:${option.color};display:inline-block;flex-shrink:0` }),
    h('span', String(option.label)),
  ])
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

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

function openAdd() {
  editingGuest.value = undefined
  showModal.value = true
}
function openEdit(guest: Guest) {
  editingGuest.value = guest
  showModal.value = true
}

// ── Columns ───────────────────────────────────────────────────────────────────
// Must be `computed` so the table re-renders when editingCell / selectOpen change.

const columns = computed<DataTableColumns<Guest>>(() => [
  {
    title: 'Name',
    key: 'name',
    render: (row) => {
      if (isEditing(row.id, 'name')) {
        return h('div', { style: 'display:flex;gap:4px;align-items:center;width:100%' }, [
          h(NInput, {
            value: editFirst.value,
            size: 'small',
            placeholder: 'First',
            style: 'flex:1;min-width:0',
            onVnodeMounted: (vnode) => (vnode.el as HTMLElement)?.querySelector('input')?.focus(),
            'onUpdate:value': (v: string) => { editFirst.value = v },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') saveName(row.id)
              if (e.key === 'Escape') cancelEdit()
            },
          }),
          h(NInput, {
            value: editLast.value,
            size: 'small',
            placeholder: 'Last',
            style: 'flex:1;min-width:0',
            'onUpdate:value': (v: string) => { editLast.value = v },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') saveName(row.id)
              if (e.key === 'Escape') cancelEdit()
            },
          }),
          h(NButton, { size: 'tiny', type: 'primary', onClick: () => saveName(row.id) }, { default: () => '✓' }),
          h(NButton, { size: 'tiny', onClick: cancelEdit }, { default: () => '✗' }),
        ])
      }

      const plusOne = getPlusOneLabel(row.plusOneOf)
      const grp = row.groupId ? groupStore.getById(row.groupId) : null
      return h('div', { class: 'editable-cell', onClick: () => startNameEdit(row) }, [
        h('div', { style: 'display:flex;align-items:center;gap:6px' }, [
          grp
            ? h('span', { style: `width:10px;height:10px;border-radius:50%;background:${grp.color};display:inline-block;flex-shrink:0` })
            : null,
          h('span', `${row.firstName} ${row.lastName}`),
        ]),
        plusOne ? h(NText, { depth: 3, style: 'font-size:11px;margin-top:1px' }, { default: () => plusOne }) : null,
      ])
    },
  },
  {
    title: 'Group',
    key: 'group',
    width: 185,
    render: (row) => {
      if (isEditing(row.id, 'group')) {
        return h(NSelect, {
          value: row.groupId ?? '',
          options: groupCellOptions.value,
          renderLabel: renderGroupLabel,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          'onUpdate:value': (val: string) => {
            guestStore.updateGuest(row.id, { groupId: val || null })
            closeSelect()
          },
          'onUpdate:show': (show: boolean) => {
            selectOpen.value = show
            if (!show) editingCell.value = null
          },
        })
      }

      const grp = row.groupId ? groupStore.getById(row.groupId) : null
      return h('div', {
        class: 'editable-cell',
        onClick: () => startSelectEdit(row.id, 'group'),
      }, [
        grp
          ? h('div', { style: 'display:flex;align-items:center;gap:6px' }, [
              h('span', { style: `width:10px;height:10px;border-radius:50%;background:${grp.color};display:inline-block;flex-shrink:0` }),
              h('span', grp.name),
            ])
          : h('span', { style: 'color:#bbb' }, '—'),
      ])
    },
  },
  {
    title: 'RSVP',
    key: 'rsvpStatus',
    width: 135,
    render: (row) => {
      if (isEditing(row.id, 'rsvp')) {
        return h(NSelect, {
          value: row.rsvpStatus,
          options: rsvpCellOptions,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          'onUpdate:value': (val: string) => {
            guestStore.updateGuest(row.id, { rsvpStatus: val as RSVPStatus })
            closeSelect()
          },
          'onUpdate:show': (show: boolean) => {
            selectOpen.value = show
            if (!show) editingCell.value = null
          },
        })
      }

      return h('div', {
        class: 'editable-cell',
        onClick: () => startSelectEdit(row.id, 'rsvp'),
      }, [h(RSVPBadge, { status: row.rsvpStatus })])
    },
  },
  {
    title: 'Meal',
    key: 'meal',
    width: 155,
    render: (row) => {
      if (isEditing(row.id, 'meal')) {
        return h(NSelect, {
          value: row.mealChoiceId ?? '',
          options: mealCellOptions.value,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          'onUpdate:value': (val: string) => {
            guestStore.updateGuest(row.id, { mealChoiceId: val || null })
            closeSelect()
          },
          'onUpdate:show': (show: boolean) => {
            selectOpen.value = show
            if (!show) editingCell.value = null
          },
        })
      }

      return h('div', {
        class: 'editable-cell',
        onClick: () => startSelectEdit(row.id, 'meal'),
      }, [h('span', getMealLabel(row.mealChoiceId))])
    },
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
      h(NSpace, { size: 8, justify: 'end' }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => 'Edit' }),
          h(NPopconfirm, { onPositiveClick: () => guestStore.deleteGuest(row.id) }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { default: () => 'Delete' }),
            default: () => 'Delete this guest and their plus-ones?',
          }),
        ],
      }),
  },
])
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">Guests</h2>
      <n-space>
        <n-button @click="showBulkModal = true">Add Multiple Guests</n-button>
        <n-button type="primary" @click="openAdd">+ Add Guest</n-button>
      </n-space>
    </n-space>

    <n-space style="margin-bottom: 16px;" wrap>
      <n-input v-model:value="search" placeholder="Search name…" clearable style="width: 220px" />
      <n-select v-model:value="rsvpFilter" :options="rsvpFilterOptions" style="width: 140px" />
      <n-select v-model:value="groupFilter" :options="groupFilterOptions" style="width: 180px" />
    </n-space>

    <EmptyState
      v-if="guestStore.guests.length === 0"
      icon="👥"
      title="No guests yet"
      description="Click 'Add Guest' or 'Add Multiple Guests' to start building your guest list."
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

    <BulkAddModal
      :show="showBulkModal"
      @close="showBulkModal = false"
    />
  </div>
</template>

<style scoped>
/* Every editable cell gets identical sizing so switching to an NSelect
   (same height via size="small") causes zero layout shift. */
.editable-cell {
  cursor: pointer;
  width: 100%;
  min-height: 28px;
  padding: 3px 6px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: background 0.1s;
}
.editable-cell:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
