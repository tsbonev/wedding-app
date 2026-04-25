<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NModal, NCard, NForm, NFormItem, NInput, NSelect, NButton, NSpace, NText
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const i18n = useI18nStore()

const namesText = ref('')
const selectedGroupId = ref<string | null>(null)

const groupOptions = computed<SelectOption[]>(() =>
  groupStore.groups.map((g) => ({
    label: g.name,
    value: g.id,
    color: g.color,
  }))
)

function renderGuestLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex; align-items:center; gap:8px' }, [
    h('span', {
      style: `width:12px; height:12px; border-radius:50%; background:${option.color ?? '#d1d5db'}; display:inline-block; flex-shrink:0`,
    }),
    h('span', String(option.label)),
  ])
}

function renderSingleSelectLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex; align-items:center; gap:8px' }, [
    h('span', {
      style: `width:12px; height:12px; border-radius:50%; background:${option.color ?? '#d1d5db'}; display:inline-block; flex-shrink:0`,
    }),
    h('span', String(option.label)),
  ])
}

function handleBulkAdd() {
  if (!namesText.value.trim()) return

  const nameEntries = namesText.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
  
  for (const entry of nameEntries) {
    const firstSpaceIndex = entry.indexOf(' ')
    let firstName = entry
    let lastName = ''

    if (firstSpaceIndex !== -1) {
      firstName = entry.substring(0, firstSpaceIndex)
      lastName = entry.substring(firstSpaceIndex + 1).trim()
    }

    guestStore.addGuest({
      firstName,
      lastName,
      rsvpStatus: 'pending',
      mealChoiceId: null,
      dietaryNotes: '',
      partnerId: null,
      parentId: null,
      isChild: false,
      isGroom: false,
      isBride: false,
      customEmoji: null,
      groupId: selectedGroupId.value,
      notes: '',
      tableId: null,
      roomId: null,
    })
  }

  namesText.value = ''
  selectedGroupId.value = null
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false" @update:show="(val) => !val && emit('close')">
    <n-card
      :title="i18n.t('add_multiple_guests')"
      style="max-width: 520px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <n-form label-placement="top">
        <n-form-item :label="i18n.t('names_separated')">
          <n-input
            v-model:value="namesText"
            type="textarea"
            :rows="4"
            :placeholder="i18n.t('placeholder_bulk_names')"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px">
              {{ i18n.t('bulk_add_instruction') }}
            </n-text>
          </template>
        </n-form-item>
        
        <n-form-item :label="i18n.t('group_for_all')">
          <n-select
            v-model:value="selectedGroupId"
            :options="groupOptions"
            :render-label="renderGuestLabel"
            :render-label-single="renderSingleSelectLabel"
            filterable
            clearable
            :placeholder="i18n.t('select_group_optional')"
          />
        </n-form-item>

        <n-space justify="end" style="margin-top: 24px">
          <n-button @click="emit('close')">{{ i18n.t('cancel') }}</n-button>
          <n-button
            type="primary"
            :disabled="!namesText.trim()"
            @click="handleBulkAdd"
          >
            {{ i18n.t('add_guests') }}
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </n-modal>
</template>
