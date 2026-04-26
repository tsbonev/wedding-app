<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NSpace, NCard, NProgress, NText, NDataTable, NSelect,
  NTag, NPopover, NInput, NButton, NDivider, NInputGroup,
  NDropdown, NTooltip
} from 'naive-ui'
import type { DataTableColumns, DataTableRowKey, DropdownOption } from 'naive-ui'
import EmojiPicker from 'vue3-emoji-picker'
// @ts-ignore
import 'vue3-emoji-picker/css'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Guest, MenuItem } from '@/types'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const guestStore = useGuestStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()
const i18n = useI18nStore()

// Meal management
const newOptionLabel = ref('')
const newOptionEmoji = ref('🍽️')

function addOption() {
  if (!newOptionLabel.value.trim()) return
  menuStore.addOption(newOptionLabel.value.trim(), newOptionEmoji.value)
  newOptionLabel.value = ''
  newOptionEmoji.value = '🍽️'
}

const editingMealId = ref<string | null>(null)
const editingMealLabel = ref('')
const editingMealEmoji = ref('')

function startEditMeal(opt: MenuItem) {
  editingMealId.value = opt.id
  editingMealLabel.value = opt.label
  editingMealEmoji.value = opt.emoji
}

function saveEditMeal(id: string) {
  if (editingMealLabel.value.trim()) {
    menuStore.updateOption(id, { 
      label: editingMealLabel.value.trim(),
      emoji: editingMealEmoji.value
    })
  }
  editingMealId.value = null
}

function onEmojiSelect(emoji: any) {
  newOptionEmoji.value = emoji.i
}

function onEditEmojiSelect(emoji: any) {
  editingMealEmoji.value = emoji.i
}

// Filtering
const nameFilter = ref('')
const groupFilter = ref<string | null>(null)

const checkedRowKeys = ref<DataTableRowKey[]>([])

const filteredGuests = computed(() => {
  return guestStore.guests.filter((g) => {
    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase()
    const matchesName = fullName.includes(nameFilter.value.toLowerCase())
    const matchesGroup = !groupFilter.value || g.groupId === groupFilter.value
    return matchesName && matchesGroup
  })
})

const groupOptions = computed(() => {
  return [
    { label: i18n.t('all_groups'), value: null as unknown as string },
    ...groupStore.groups.map(g => ({
      label: g.name,
      value: g.id,
      color: g.color
    }))
  ]
})

function renderGroupLabel(option: any) {
  const content = option.color 
    ? h('div', { style: 'display:flex;align-items:center;gap:8px;overflow:hidden' }, [
        h('span', { style: `width:10px;height:10px;border-radius:50%;background:${option.color};display:inline-block;flex-shrink:0` }),
        h('span', { style: 'text-overflow:ellipsis;overflow:hidden;white-space:nowrap' }, String(option.label)),
      ])
    : h('span', String(option.label))

  return h(NTooltip, { trigger: 'hover', placement: 'top-start' }, {
    trigger: () => content,
    default: () => String(option.label)
  })
}

const confirmedGuests = computed(() => guestStore.guests.filter((g) => g.rsvpStatus === 'confirmed'))

const mealCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const opt of menuStore.menuOptions) counts[opt.id] = 0
  counts['none'] = 0
  for (const g of confirmedGuests.value) {
    if (g.mealChoiceId && counts[g.mealChoiceId] !== undefined) counts[g.mealChoiceId]++
    else counts['none']++
  }
  return counts
})

const massEditOptions = computed(() => [
  {
    label: i18n.t('rsvp_status'),
    key: 'rsvp',
    children: [
      { label: i18n.t('confirmed'), key: 'rsvp-confirmed' },
      { label: i18n.t('pending'), key: 'rsvp-pending' },
      { label: i18n.t('declined'), key: 'rsvp-declined' }
    ]
  },
  {
    label: i18n.t('group'),
    key: 'group',
    children: [
      { label: `— ${i18n.t('none')} —`, key: 'group-none' },
      ...groupStore.groups.map(g => ({ label: g.name, key: `group-${g.id}`, color: g.color }))
    ]
  },
  {
    label: i18n.t('selected_menu'),
    key: 'menu',
    children: [
      { label: `— ${i18n.t('none')} —`, key: 'menu-none' },
      ...menuStore.menuOptions.map(o => ({ label: `${o.emoji} ${o.label}`, key: `menu-${o.id}` }))
    ]
  }
])

function renderMassEditLabel(option: DropdownOption) {
  if (String(option.key).startsWith('group-') && option.color) {
    const content = h(NSpace, { align: 'center', size: 'small', style: 'flex-wrap: nowrap; overflow: hidden;' }, {
      default: () => [
        h(NTag, {
          color: { color: String(option.color), textColor: '#fff' },
          bordered: false,
          size: 'small',
          style: 'width: 12px; height: 12px; padding: 0; border-radius: 50%; flex-shrink: 0;'
        }),
        h('span', { style: 'text-overflow: ellipsis; overflow: hidden; white-space: nowrap;' }, String(option.label))
      ]
    })

    return h(NTooltip, { trigger: 'hover', placement: 'right' }, {
      trigger: () => content,
      default: () => String(option.label)
    })
  }
  return String(option.label)
}

function handleMassEdit(key: string) {
  const ids = checkedRowKeys.value as string[]
  if (ids.length === 0) return

  if (key.startsWith('rsvp-')) {
    const status = key.replace('rsvp-', '')
    guestStore.bulkUpdateGuests(ids, { rsvpStatus: status as any })
  } else if (key.startsWith('group-')) {
    const groupId = key.replace('group-', '')
    guestStore.bulkUpdateGuests(ids, { groupId: groupId === 'none' ? null : groupId })
  } else if (key.startsWith('menu-')) {
    const mealId = key.replace('menu-', '')
    guestStore.bulkUpdateGuests(ids, { mealChoiceId: mealId === 'none' ? null : mealId })
  }
  checkedRowKeys.value = []
}

const columns = computed((): DataTableColumns<Guest> => [
  {
    type: 'selection',
    width: 50
  },
  { 
    title: i18n.t('first_name'), 
    key: 'name', 
    width: 200,
    render: (r) => `${r.firstName} ${r.lastName}`,
    sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  },
  {
    title: i18n.t('group'),
    key: 'group',
    width: 150,
    render: (r) => {
      const group = groupStore.getById(r.groupId || '')
      return group ? h(NTag, { color: { color: group.color, textColor: '#fff' }, bordered: false, size: 'small' }, { default: () => group.name }) : '-'
    },
    sorter: (a, b) => {
      const groupA = a.groupId ? groupStore.getById(a.groupId)?.name || '' : ''
      const groupB = b.groupId ? groupStore.getById(b.groupId)?.name || '' : ''
      return groupA.localeCompare(groupB)
    }
  },
  { 
    title: 'RSVP', 
    key: 'rsvp', 
    width: 110, 
    render: (r) => h(RSVPBadge, { status: r.rsvpStatus }),
    sorter: (a, b) => a.rsvpStatus.localeCompare(b.rsvpStatus)
  },
  {
    title: i18n.t('meals'),
    key: 'meal',
    render: (r) => {
      const opts = menuStore.menuOptions.map((o: MenuItem) => ({ label: `${o.emoji} ${o.label}`, value: o.id }))
      return h(NSelect, {
        value: r.mealChoiceId,
        options: opts,
        clearable: true,
        placeholder: i18n.t('select_meal'),
        style: 'min-width: 160px',
        'onUpdate:value': (val: string | null) => guestStore.updateGuest(r.id, { mealChoiceId: val }),
      })
    },
    sorter: (a, b) => {
      const mealA = a.mealChoiceId ? menuStore.menuOptions.find(o => o.id === a.mealChoiceId)?.label || '' : ''
      const mealB = b.mealChoiceId ? menuStore.menuOptions.find(o => o.id === b.mealChoiceId)?.label || '' : ''
      return mealA.localeCompare(mealB)
    },
    width: 200
  },
  {
    title: i18n.t('dietary_notes'),
    key: 'dietaryNotes',
    minWidth: 200,
    render: (r) => h(NInput, {
      value: r.dietaryNotes,
      placeholder: i18n.t('notes'),
      size: 'small',
      'onUpdate:value': (val: string) => guestStore.updateGuest(r.id, { dietaryNotes: val }),
    }),
  },
])
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px;">{{ i18n.t('meal_preferences') }}</h2>

    <EmptyState
      v-if="guestStore.guests.length === 0"
      icon="🍽️"
      :title="i18n.t('no_guests_yet')"
      :description="i18n.t('add_guests_meal_instruction')"
    />

    <n-space v-else vertical :size="24">
      <n-card :title="i18n.t('meal_options')">
        <n-space wrap style="margin-bottom: 12px;">
          <div v-for="opt in menuStore.menuOptions" :key="opt.id" class="meal-tag-wrapper">
            <n-popover trigger="click" placement="bottom" :show="editingMealId === opt.id" @clickoutside="editingMealId = null">
              <template #trigger>
                <n-tag
                  closable
                  @close="menuStore.removeOption(opt.id)"
                  @click="startEditMeal(opt)"
                  style="cursor: pointer"
                >
                  {{ opt.emoji }} {{ opt.label }}
                </n-tag>
              </template>
              <div style="display: flex; gap: 8px; align-items: flex-end;">
                <n-input-group>
                  <n-popover trigger="click" placement="bottom-start" :width="300" scrollable>
                    <template #trigger>
                      <n-button ghost style="padding: 0 8px">
                        {{ editingMealEmoji || '🍽️' }}
                      </n-button>
                    </template>
                    <EmojiPicker :native="true" @select="onEditEmojiSelect" />
                  </n-popover>
                  <n-input
                    v-model:value="editingMealLabel"
                    size="small"
                    @keyup.enter="saveEditMeal(opt.id)"
                    :placeholder="i18n.t('rename_meal')"
                  />
                </n-input-group>
                <n-button size="small" type="primary" @click="saveEditMeal(opt.id)">{{ i18n.t('save') }}</n-button>
              </div>
            </n-popover>
          </div>
          <n-text v-if="menuStore.menuOptions.length === 0" depth="3">{{ i18n.t('no_meal_options_yet') }}</n-text>
        </n-space>
        <n-divider />
        <n-space align="end">
          <div class="n-form-item-wrapper" style="width: 120px; margin: 0">
            <span class="field-label">{{ i18n.t('emoji') }}</span>
            <n-input-group>
              <n-input v-model:value="newOptionEmoji" maxlength="2" />
              <n-popover trigger="click" placement="bottom-end" :width="300" scrollable>
                <template #trigger>
                  <n-button ghost style="padding: 0 8px">
                    {{ newOptionEmoji || '🍽️' }}
                  </n-button>
                </template>
                <EmojiPicker :native="true" @select="onEmojiSelect" />
              </n-popover>
            </n-input-group>
          </div>
          <div class="n-form-item-wrapper" style="width: 160px; margin: 0">
            <span class="field-label">{{ i18n.t('label') }}</span>
            <n-input v-model:value="newOptionLabel" :placeholder="i18n.t('label')" @keyup.enter="addOption" />
          </div>
          <n-button type="primary" :disabled="!newOptionLabel.trim()" @click="addOption">{{ i18n.t('add') }}</n-button>
        </n-space>
      </n-card>

      <n-card :title="i18n.t('summary')">
        <n-space vertical>
          <div v-for="opt in menuStore.menuOptions" :key="opt.id">
            <n-text>{{ opt.emoji }} {{ opt.label }}: {{ mealCounts[opt.id] }}</n-text>
            <n-progress
              type="line"
              :percentage="confirmedGuests.length ? Math.round((mealCounts[opt.id] / confirmedGuests.length) * 100) : 0"
            />
          </div>
          <div>
            <n-text depth="3">{{ i18n.t('no_selection') }}: {{ mealCounts['none'] }}</n-text>
          </div>
        </n-space>
      </n-card>

      <n-space align="center">
        <n-input
          v-model:value="nameFilter"
          :placeholder="i18n.t('search_guests')"
          clearable
          style="width: 250px"
        />
        <n-select
          v-model:value="groupFilter"
          :options="groupOptions"
          :placeholder="i18n.t('select_group_optional')"
          :render-label="renderGroupLabel"
          :render-tag="renderGroupLabel"
          clearable
          style="width: 250px"
        />
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
      </n-space>

      <n-data-table
        :columns="columns"
        :data="filteredGuests"
        v-model:checked-row-keys="checkedRowKeys"
        :row-key="(r: Guest) => r.id"
        :pagination="{ pageSize: 20 }"
        striped
        :sort-config="{ unselectable: false }"
      />
    </n-space>
  </div>
</template>

<style scoped>
.meal-tag-wrapper {
  display: inline-block;
}
/* Helper component for consistent label styling without full NForm */
:deep(.n-form-item-wrapper) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
:deep(.n-form-item-wrapper .field-label) {
  font-size: 13px;
  color: #666;
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
