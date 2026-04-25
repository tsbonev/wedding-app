<script setup lang="ts">
import { ref, computed } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSpace, NButton, NSelect, NDivider } from 'naive-ui'
import type { Room } from '@/types'
import { useRoomStore } from '@/stores/useRoomStore'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{ initial?: Partial<Room>; submitLabel?: string }>()
const emit = defineEmits<{ (e: 'submit', data: Omit<Room, 'id' | 'guestIds'>): void; (e: 'cancel'): void }>()

const roomStore = useRoomStore()
const i18n = useI18nStore()
const newType = ref('')
const editingType = ref<string | null>(null)
const editingTypeName = ref('')

const typeOptions = computed(() => {
  return roomStore.roomTypes.map(t => ({ 
    label: i18n.t(t), 
    value: t 
  }))
})

const form = ref({
  number: props.initial?.number ?? '',
  type: props.initial?.type ?? '',
  capacity: props.initial?.capacity ?? 2,
  checkIn: props.initial?.checkIn ?? null,
  checkOut: props.initial?.checkOut ?? null,
  notes: props.initial?.notes ?? '',
})

function handleAddType() {
  const type = newType.value.trim().toLowerCase()
  if (type) {
    roomStore.addRoomType(type)
    form.value.type = type
    newType.value = ''
  }
}

function startEditType(type: string) {
  editingType.value = type
  editingTypeName.value = type
}

function saveEditType(oldType: string) {
  const name = editingTypeName.value.trim().toLowerCase()
  if (name && name !== oldType) {
    roomStore.updateRoomType(oldType, name)
    if (form.value.type === oldType) form.value.type = name
  }
  editingType.value = null
}

function handleSubmit() {
  emit('submit', { ...form.value })
}
</script>

<template>
  <n-form :model="form" label-placement="top">
    <n-space>
      <n-form-item :label="i18n.t('room_number_name')" style="flex:1; min-width:130px">
        <n-input v-model:value="form.number" :placeholder="i18n.t('placeholder_room_name')" />
      </n-form-item>
      <n-form-item :label="i18n.t('shape')" style="flex:2; min-width:200px">
        <n-select v-model:value="form.type" :options="typeOptions" :placeholder="i18n.t('select_type')">
          <template #action>
            <n-space vertical size="small">
              <n-divider style="margin: 0" />
              <n-space inline>
                <n-input v-model:value="newType" size="small" :placeholder="i18n.t('add_custom_type')" @keyup.enter="handleAddType" />
                <n-button size="small" type="primary" @click="handleAddType">{{ i18n.t('add') }}</n-button>
              </n-space>
            </n-space>
          </template>
        </n-select>
      </n-form-item>
    </n-space>

    <n-space wrap style="margin-bottom: 20px; gap: 8px;">
      <div v-for="t in roomStore.roomTypes" :key="t">
        <n-popover trigger="click" placement="bottom" :show="editingType === t" @clickoutside="editingType = null">
          <template #trigger>
            <n-tag
              closable
              @close="roomStore.removeRoomType(t)"
              @click="startEditType(t)"
              style="cursor: pointer"
              :type="form.type === t ? 'primary' : 'default'"
            >
              {{ i18n.t(t) }}
            </n-tag>
          </template>
          <div style="display: flex; gap: 8px;">
            <n-input
              v-model:value="editingTypeName"
              size="small"
              @keyup.enter="saveEditType(t)"
            />
            <n-button size="small" type="primary" @click="saveEditType(t)">{{ i18n.t('save') }}</n-button>
          </div>
        </n-popover>
      </div>
    </n-space>
    <n-form-item :label="i18n.t('capacity')">
      <n-input-number v-model:value="form.capacity" :min="1" :max="10" />
    </n-form-item>
    <n-space>
      <n-form-item :label="i18n.t('check_in')" style="flex:1">
        <n-input v-model:value="form.checkIn as string" :placeholder="i18n.t('placeholder_date')" />
      </n-form-item>
      <n-form-item :label="i18n.t('check_out')" style="flex:1">
        <n-input v-model:value="form.checkOut as string" :placeholder="i18n.t('placeholder_date')" />
      </n-form-item>
    </n-space>
    <n-form-item :label="i18n.t('notes')">
      <n-input v-model:value="form.notes" type="textarea" :rows="2" :placeholder="i18n.t('notes')" />
    </n-form-item>
    <n-space justify="end">
      <n-button @click="emit('cancel')">{{ i18n.t('cancel') }}</n-button>
      <n-button type="primary" :disabled="!form.number.trim()" @click="handleSubmit">
        {{ submitLabel ?? i18n.t('save') }}
      </n-button>
    </n-space>
  </n-form>
</template>
