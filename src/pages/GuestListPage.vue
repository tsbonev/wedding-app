<script setup lang="ts">
import { ref, computed, h, reactive } from 'vue'
import {
  NButton, NSpace, NInput, NSelect, NDataTable, NTag, NPopconfirm, NText,
  NDropdown, NTooltip
} from 'naive-ui'
import type { DataTableColumns, SelectOption, DataTableRowKey } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Guest, RSVPStatus, MenuItem } from '@/types'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import BulkAddModal from '@/components/guest/BulkAddModal.vue'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useMassEdit } from '@/composables/useMassEdit'

const guestStore = useGuestStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()
const seatingStore = useSeatingStore()
const roomStore = useRoomStore()
const i18n = useI18nStore()

// ── Filters ───────────────────────────────────────────────────────────────────

const showModal = ref(false)
const showBulkModal = ref(false)
const editingGuest = ref<Guest | undefined>(undefined)
const search = ref('')
const rsvpFilter = ref('')
const groupFilter = ref('')
const roomFilter = ref('')
const tableFilter = ref('')
const ageFilter = ref('')

const checkedRowKeys = ref<DataTableRowKey[]>([])

const rsvpFilterOptions = computed(() => [
  { label: i18n.t('all_rsvp'), value: '' },
  { label: i18n.t('confirmed'), value: 'confirmed' },
  { label: i18n.t('pending'), value: 'pending' },
  { label: i18n.t('declined'), value: 'declined' },
])

const groupFilterOptions = computed<(SelectOption & { color?: string })[]>(() => [
  { label: i18n.t('all_groups'), value: '' },
  ...groupStore.groups.map((g) => ({ label: g.name, value: g.id, color: g.color })),
])

const roomFilterOptions = computed(() => [
  { label: i18n.t('all_rooms'), value: '' },
  { label: i18n.t('no_room'), value: 'none' },
  ...roomStore.rooms.map((r) => ({ label: `${r.number}`, value: r.id })),
])

const tableFilterOptions = computed(() => [
  { label: i18n.t('all_tables'), value: '' },
  { label: i18n.t('no_table'), value: 'none' },
  ...seatingStore.tables.map((t) => ({ label: t.name, value: t.id })),
])

const ageFilterOptions = computed(() => [
  { label: i18n.t('all_ages'), value: '' },
  { label: i18n.t('adults'), value: 'adults' },
  { label: i18n.t('children'), value: 'children' },
])

const filtered = computed(() => {
  let list = [...guestStore.guests]
  if (rsvpFilter.value) list = list.filter((g) => g.rsvpStatus === rsvpFilter.value)
  if (groupFilter.value) list = list.filter((g) => g.groupId === groupFilter.value)
  if (roomFilter.value) {
    if (roomFilter.value === 'none') {
      list = list.filter((g) => !g.roomId)
    } else {
      list = list.filter((g) => g.roomId === roomFilter.value)
    }
  }
  if (tableFilter.value) {
    if (tableFilter.value === 'none') {
      list = list.filter((g) => !g.tableId)
    } else {
      list = list.filter((g) => g.tableId === tableFilter.value)
    }
  }
  if (ageFilter.value) {
    if (ageFilter.value === 'adults') {
      list = list.filter((g) => !g.isChild)
    } else if (ageFilter.value === 'children') {
      list = list.filter((g) => g.isChild)
    }
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Inline editing ────────────────────────────────────────────────────────────

type EditField = 'group' | 'rsvp' | 'meal'
const editingCell = ref<{ id: string; field: EditField } | null>(null)
const selectOpen = ref(false)

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

function cancelEdit() {
  editingCell.value = null
  selectOpen.value = false
}

// ── Select options ────────────────────────────────────────────────────────────

const rsvpCellOptions = computed(() => [
  { label: i18n.t('confirmed'), value: 'confirmed' },
  { label: i18n.t('pending'), value: 'pending' },
  { label: i18n.t('declined'), value: 'declined' },
])

const mealCellOptions = computed(() => [
  { label: `— ${i18n.t('none')} —`, value: '' },
  ...menuStore.menuOptions.map((o: MenuItem) => ({ label: `${o.emoji} ${o.label}`, value: o.id })),
])

const groupCellOptions = computed<(SelectOption & { color?: string })[]>(() => [
  { label: `— ${i18n.t('none')} —`, value: '' },
  ...groupStore.groups.map((g) => ({ label: g.name, value: g.id, color: g.color })),
])

function renderGroupLabel(option: SelectOption & { color?: string }) {
  const content = option.color
    ? h('div', { style: 'display:flex;align-items:center;gap:8px;overflow:hidden' }, [
        h('span', { style: `width:10px;height:10px;border-radius:50%;background:${option.color};display:inline-block;flex-shrink:0` }),
        h('span', { style: 'text-overflow:ellipsis;overflow:hidden;white-space:nowrap' }, String(option.label)),
      ])
    : h('span', String(option.label))

  return h(NTooltip, { trigger: 'hover', placement: 'top-start' }, {
    trigger: () => content,
    default: () => String(option.label),
  })
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function getMealLabel(id: string | null) {
  if (!id) return '—'
  const opt = menuStore.menuOptions.find((o: MenuItem) => o.id === id)
  return opt ? `${opt.emoji} ${opt.label}` : '—'
}

function getPartnerLabel(id: string | null) {
  if (!id) return null
  const g = guestStore.getById(id)
  return g ? `${i18n.t('partner_of')} ${g.firstName} ${g.lastName}` : null
}

function getParentLabel(id: string | null) {
  if (!id) return null
  const g = guestStore.getById(id)
  return g ? `${i18n.t('child_of')} ${g.firstName} ${g.lastName}` : null
}

function getTableName(id: string | null) {
  if (!id) return '—'
  const t = seatingStore.getById(id)
  return t ? `🪑 ${t.name}` : '—'
}

function getRoomName(id: string | null) {
  if (!id) return '—'
  const r = roomStore.getById(id)
  return r ? `🏨 ${i18n.t('room')} ${r.number}` : '—'
}

function renderNotes(row: Guest) {
  const hasNotes = row.notes && row.notes.trim()
  const hasDietary = row.dietaryNotes && row.dietaryNotes.trim()
  if (!hasNotes && !hasDietary) return null

  return h('div', { 
    style: 'margin-top: 4px; padding: 4px 8px; background: rgba(0,0,0,0.03); border-radius: 4px; font-size: 11px; color: var(--text-muted); display: flex; flex-direction: column; gap: 2px;' 
  }, [
    hasNotes ? h('div', [
      h('strong', { style: 'margin-right: 4px' }, i18n.t('notes') + ':'),
      h('span', row.notes)
    ]) : null,
    hasDietary ? h('div', [
      h('strong', { style: 'margin-right: 4px' }, i18n.t('dietary_notes') + ':'),
      h('span', row.dietaryNotes)
    ]) : null
  ])
}

function openAdd() {
  editingGuest.value = undefined
  showModal.value = true
}
function openEdit(guest: Guest) {
  editingGuest.value = guest
  showModal.value = true
}

// ── Mass edit ─────────────────────────────────────────────────────────────────

const { massEditOptions, renderMassEditLabel, handleMassEdit } = useMassEdit(checkedRowKeys)

const pagination = reactive({ pageSize: 20, page: 1 })

// ── Columns ───────────────────────────────────────────────────────────────────

const columns = computed<DataTableColumns<Guest>>(() => [
  {
    type: 'selection',
    width: '5%'
  },
  {
    title: i18n.t('first_name'),
    key: 'name',
    width: '20%',
    render: (row) => {
      const partnerLabel = getPartnerLabel(row.partnerId)
      const parentLabel = getParentLabel(row.parentId)
      return h('div', { class: 'name-cell' }, [
        h('div', { style: 'display:flex;align-items:center;gap:6px' }, [
          h('span', `${row.firstName} ${row.lastName}`),
          row.customEmoji ? h('span', { title: i18n.t('custom_emoji') }, row.customEmoji) : [
            row.isGroom ? h('span', { title: i18n.t('groom') }, '🤵') : null,
            row.isBride ? h('span', { title: i18n.t('bride') }, '👰') : null,
            row.isChild ? h('span', { title: i18n.t('child') }, '👶') : null,
          ],
        ]),
        partnerLabel ? h(NText, { depth: 3, style: 'font-size:11px;margin-top:1px' }, { default: () => partnerLabel }) : null,
        parentLabel ? h(NText, { depth: 3, style: 'font-size:11px;margin-top:1px' }, { default: () => parentLabel }) : null,
        renderNotes(row),
      ])
    },
    sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  },
  {
    title: i18n.t('group'),
    key: 'group',
    width: '18%',
    render: (row) => {
      if (isEditing(row.id, 'group')) {
        return h(NSelect, {
          value: row.groupId ?? '',
          options: groupCellOptions.value,
          renderLabel: renderGroupLabel,
          renderLabelSingle: renderGroupLabel,
          filterable: true,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          onVnodeMounted: (vnode) => {
            const el = vnode.el as HTMLElement
            const input = el?.querySelector('input')
            if (input) {
              input.focus()
            } else {
              el?.focus()
            }
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              cancelEdit()
            }
          },
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

      const group = row.groupId ? groupStore.getById(row.groupId) : null
      return h('div', {
        class: 'editable-cell',
        onClick: () => startSelectEdit(row.id, 'group'),
      }, [
        group
          ? h(NTag, { color: { color: group.color, textColor: '#fff' }, bordered: false, size: 'small' }, { default: () => group.name })
          : h('span', { style: 'color:#bbb' }, '—'),
      ])
    },
    sorter: (a, b) => {
      const groupA = a.groupId ? groupStore.getById(a.groupId)?.name || '' : ''
      const groupB = b.groupId ? groupStore.getById(b.groupId)?.name || '' : ''
      return groupA.localeCompare(groupB)
    }
  },
  {
    title: 'RSVP',
    key: 'rsvpStatus',
    width: '12%',
    render: (row) => {
      if (isEditing(row.id, 'rsvp')) {
        return h(NSelect, {
          value: row.rsvpStatus,
          options: rsvpCellOptions.value,
          filterable: true,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          onVnodeMounted: (vnode) => {
            const el = vnode.el as HTMLElement
            const input = el?.querySelector('input')
            if (input) {
              input.focus()
            } else {
              el?.focus()
            }
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              cancelEdit()
            }
          },
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
    sorter: (a, b) => a.rsvpStatus.localeCompare(b.rsvpStatus)
  },
  {
    title: i18n.t('meals'),
    key: 'meal',
    width: '15%',
    render: (row) => {
      if (isEditing(row.id, 'meal')) {
        return h(NSelect, {
          value: row.mealChoiceId ?? '',
          options: mealCellOptions.value,
          filterable: true,
          size: 'small',
          show: selectOpen.value,
          style: 'width:100%',
          onVnodeMounted: (vnode) => {
            const el = vnode.el as HTMLElement
            const input = el?.querySelector('input')
            if (input) {
              input.focus()
            } else {
              el?.focus()
            }
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              cancelEdit()
            }
          },
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
    sorter: (a, b) => {
      const mealA = getMealLabel(a.mealChoiceId)
      const mealB = getMealLabel(b.mealChoiceId)
      return mealA.localeCompare(mealB)
    }
  },
  {
    title: i18n.t('table'),
    key: 'tableId',
    width: '10%',
    render: (row) => row.tableId ? h(NTag, { size: 'small' }, { default: () => getTableName(row.tableId) }) : '—',
    sorter: (a, b) => getTableName(a.tableId).localeCompare(getTableName(b.tableId))
  },
  {
    title: i18n.t('room'),
    key: 'roomId',
    width: '10%',
    render: (row) => row.roomId ? h(NTag, { size: 'small' }, { default: () => getRoomName(row.roomId) }) : '—',
    sorter: (a, b) => getRoomName(a.roomId).localeCompare(getRoomName(b.roomId))
  },
  {
    title: '',
    key: 'actions',
    width: '10%',
    render: (row) =>
      h(NSpace, { size: 8, justify: 'end' }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => i18n.t('edit') }),
          h(NPopconfirm, { onPositiveClick: () => guestStore.deleteGuest(row.id) }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', ghost: true }, { default: () => i18n.t('delete') }),
            default: () => i18n.t('delete_confirm'),
          }),
        ],
      }),
  },
])
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">{{ i18n.t('guests') }}</h2>
      <n-space>
        <n-button @click="showBulkModal = true">{{ i18n.t('add_multiple_guests') }}</n-button>
        <n-button type="primary" @click="openAdd">+ {{ i18n.t('add_guest') }}</n-button>
      </n-space>
    </n-space>

    <div class="filter-bar">
      <n-input v-model:value="search" :placeholder="i18n.t('search_name')" clearable />
      <n-select v-model:value="rsvpFilter" :options="rsvpFilterOptions" />
      <n-select
        v-model:value="groupFilter"
        :options="groupFilterOptions"
        :render-label="renderGroupLabel"
        :render-label-single="renderGroupLabel"
        filterable
      />
      <n-select v-model:value="tableFilter" :options="tableFilterOptions" filterable />
      <n-select v-model:value="roomFilter" :options="roomFilterOptions" filterable />
      <n-select v-model:value="ageFilter" :options="ageFilterOptions" />

      <n-dropdown
        v-if="checkedRowKeys.length > 0"
        :options="massEditOptions"
        :render-label="renderMassEditLabel"
        @select="handleMassEdit"
      >
        <n-button type="info" ghost>
          {{ i18n.t('mass_edit') }} ({{ checkedRowKeys.length }})
        </n-button>
      </n-dropdown>
    </div>

    <EmptyState
      v-if="guestStore.guests.length === 0"
      icon="👥"
      :title="i18n.t('no_guests_yet')"
      :description="i18n.t('no_guests_description')"
    />

    <n-data-table
      v-else
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="filtered"
      :row-key="(row: Guest) => row.id"
      :pagination="pagination"
      :scroll-x="900"
      striped
      :sort-config="{ unselectable: false }"
      @update:page="(p) => { pagination.page = p }"
      @update:sorter="() => { pagination.page = 1 }"
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
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
.filter-bar :deep(.n-input),
.filter-bar :deep(.n-select) {
  flex: 1 1 140px;
  min-width: 120px;
  max-width: 260px;
}
@media (max-width: 767px) {
  .filter-bar :deep(.n-input),
  .filter-bar :deep(.n-select) {
    max-width: 100%;
  }
}

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

:deep(.n-data-table-sorter) {
  opacity: 0;
  transition: opacity 0.2s;
}
:deep(.n-data-table-th--sortable:hover .n-data-table-sorter),
:deep(.n-data-table-sorter--asc),
:deep(.n-data-table-sorter--desc) {
  opacity: 1;
}
</style>
