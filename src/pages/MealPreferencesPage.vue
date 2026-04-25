<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NSpace, NCard, NProgress, NText, NDataTable, NSelect,
  NTag, NPopover, NInput, NButton, NDivider, NInputGroup
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import EmojiPicker from 'vue3-emoji-picker'
// @ts-ignore
import 'vue3-emoji-picker/css'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { Guest, MenuItem } from '@/types'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const guestStore = useGuestStore()
const menuStore = useMenuStore()
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

const columns = computed((): DataTableColumns<Guest> => [
  { title: i18n.t('first_name'), key: 'name', render: (r) => `${r.firstName} ${r.lastName}` },
  { title: 'RSVP', key: 'rsvp', width: 110, render: (r) => h(RSVPBadge, { status: r.rsvpStatus }) },
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
  },
  {
    title: i18n.t('dietary_notes'),
    key: 'dietaryNotes',
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

      <n-data-table
        :columns="columns"
        :data="guestStore.guests"
        :row-key="(r: Guest) => r.id"
        :pagination="{ pageSize: 20 }"
        striped
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
</style>
