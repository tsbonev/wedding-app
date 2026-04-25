<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NModal, NCard, NForm, NFormItem, NInput, NSelect, NButton, NSpace, NText
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const guestStore = useGuestStore()
const groupStore = useGroupStore()

const namesText = ref('')
const selectedGroupId = ref<string | null>(null)

const groupOptions = computed<SelectOption[]>(() =>
  groupStore.groups.map((g) => ({
    label: g.name,
    value: g.id,
    color: g.color,
  }))
)

function renderGroupLabel(option: SelectOption) {
  return h('div', { style: 'display:flex; align-items:center; gap:8px' }, [
    h('span', {
      style: `width:12px; height:12px; border-radius:50%; background:${option.color}; display:inline-block; flex-shrink:0`,
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
      plusOneOf: null,
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
      title="Add Multiple Guests"
      style="max-width: 520px; width: 95vw;"
      closable
      @close="emit('close')"
    >
      <n-form label-placement="top">
        <n-form-item label="Names (separated by commas)">
          <n-input
            v-model:value="namesText"
            type="textarea"
            :rows="4"
            placeholder="John Doe, Jane Smith, Robert De Niro"
          />
          <template #feedback>
            <n-text depth="3" style="font-size: 12px">
              Format: "First Last". If more than one space, the first space separates first and last name.
            </n-text>
          </template>
        </n-form-item>
        
        <n-form-item label="Group for all these guests">
          <n-select
            v-model:value="selectedGroupId"
            :options="groupOptions"
            :render-label="renderGroupLabel"
            clearable
            placeholder="Select group (optional)"
          />
        </n-form-item>

        <n-space justify="end" style="margin-top: 24px">
          <n-button @click="emit('close')">Cancel</n-button>
          <n-button
            type="primary"
            :disabled="!namesText.trim()"
            @click="handleBulkAdd"
          >
            Add Guests
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </n-modal>
</template>
