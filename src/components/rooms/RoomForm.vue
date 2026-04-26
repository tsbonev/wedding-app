<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSpace, NButton, NSelect, NDatePicker, NCheckbox, NTag, NPopover, NCollapseTransition } from 'naive-ui'
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
  return roomStore.roomTypes.map(t => {
    const loc = i18n.t(t)
    return { 
      label: loc, 
      value: loc 
    }
  })
})

const form = ref({
  number: props.initial?.number ?? '',
  type: props.initial?.type ? i18n.t(props.initial.type) : '',
  capacity: props.initial?.capacity ?? 2,
  checkIn: null as string | null,
  checkOut: null as string | null,
  isCustomTimes: props.initial?.isCustomTimes ?? false,
  notes: props.initial?.notes ?? '',
})

function safeParseDate(val: string | null | undefined, includeTime: boolean): string | null {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  
  if (includeTime) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  
  return d.toISOString().split('T')[0]
}

// Sync dates on mount/initial change
watch(() => props.initial, (init) => {
  form.value.checkIn = safeParseDate(init?.checkIn, true)
  form.value.checkOut = safeParseDate(init?.checkOut, true)
}, { immediate: true })

const isAdding = ref(false)
const defaultTypes = ['suite', 'single', 'double']

const hasCustomTypes = computed(() => {
  return roomStore.roomTypes.some(t => !defaultTypes.includes(t))
})

function canDeleteType(type: string) {
  if (!defaultTypes.includes(type)) return true
  return hasCustomTypes.value
}

function handleAddType() {
  const type = newType.value.trim()
  if (type) {
    const exists = roomStore.roomTypes.some(t => t === type || i18n.t(t) === type)
    if (!exists) {
      roomStore.addRoomType(type)
    }
    form.value.type = type
    newType.value = ''
    isAdding.value = false
  }
}

function startEditType(type: string) {
  editingType.value = type
  editingTypeName.value = i18n.t(type)
}

function saveEditType(oldType: string) {
  const name = editingTypeName.value.trim()
  if (name && name !== oldType) {
    roomStore.updateRoomType(oldType, name)
    // Update local form type if it was using the old type (either as key or translated)
    if (form.value.type === oldType || form.value.type === i18n.t(oldType)) {
      form.value.type = name
    }
  }
  editingType.value = null
}

function handleSubmit() {
  emit('submit', { ...form.value })
}
</script>

<template>
  <n-form :model="form" label-placement="top">
    <n-space vertical :size="20">
      <n-space>
        <n-form-item :label="i18n.t('room_number_name')" style="min-width: 130px; flex: 1" :show-feedback="false">
          <n-input v-model:value="form.number" :placeholder="i18n.t('placeholder_room_name')" />
        </n-form-item>
        <n-form-item :label="i18n.t('capacity')" style="min-width: 100px; flex: 1" :show-feedback="false">
          <n-input-number v-model:value="form.capacity" :min="1" :max="10" style="width: 100%" />
        </n-form-item>
      </n-space>

      <n-form-item :label="i18n.t('shape')" :show-feedback="false">
        <n-select v-model:value="form.type" :options="typeOptions" :placeholder="i18n.t('select_type')" />
      </n-form-item>

      <n-space wrap :size="[8, 12]" style="margin-top: -8px">
        <div v-for="t in roomStore.roomTypes" :key="t">
          <n-popover trigger="click" placement="bottom" :show="editingType === t" @clickoutside="editingType = null">
            <template #trigger>
              <n-tag
                :closable="canDeleteType(t)"
                @close="roomStore.removeRoomType(t)"
                @click="startEditType(t)"
                style="cursor: pointer"
                :type="form.type === t || form.type === i18n.t(t) ? 'primary' : 'default'"
              >
                {{ i18n.t(t) }}
              </n-tag>
            </template>
            <n-space :size="8">
              <n-input
                v-model:value="editingTypeName"
                size="small"
                @keyup.enter="saveEditType(t)"
              />
              <n-button size="small" type="primary" @click="saveEditType(t)">{{ i18n.t('save') }}</n-button>
            </n-space>
          </n-popover>
        </div>

        <n-button v-if="!isAdding" size="small" dashed @click="isAdding = true">
          + {{ i18n.t('add_custom_type') }}
        </n-button>
        <n-space v-else inline :size="8">
          <n-input
            v-model:value="newType"
            size="small"
            auto-focus
            :placeholder="i18n.t('add_custom_type')"
            @keyup.enter="handleAddType"
            @blur="!newType ? isAdding = false : null"
            style="width: 150px"
          />
          <n-button size="small" type="primary" @click="handleAddType">{{ i18n.t('add') }}</n-button>
        </n-space>
      </n-space>

      <n-space vertical :size="12">
        <n-checkbox v-model:checked="form.isCustomTimes">
          {{ i18n.t('custom_times_label') }}
        </n-checkbox>

        <n-collapse-transition :show="form.isCustomTimes">
          <n-space>
            <n-form-item :label="i18n.t('check_in')" style="flex: 1" :show-feedback="false">
              <n-date-picker
                v-model:formatted-value="form.checkIn"
                value-format="yyyy-MM-dd HH:mm"
                type="datetime"
                style="width: 100%"
                :placeholder="i18n.t('placeholder_datetime')"
                clearable
                update-value-on-close
                :time-picker-props="{ format: 'HH:mm' }"
                :actions="['now', 'confirm']"
              />
            </n-form-item>
            <n-form-item :label="i18n.t('check_out')" style="flex: 1" :show-feedback="false">
              <n-date-picker
                v-model:formatted-value="form.checkOut"
                value-format="yyyy-MM-dd HH:mm"
                type="datetime"
                style="width: 100%"
                :placeholder="i18n.t('placeholder_datetime')"
                clearable
                update-value-on-close
                :time-picker-props="{ format: 'HH:mm' }"
                :actions="['now', 'confirm']"
              />
            </n-form-item>
          </n-space>
        </n-collapse-transition>
      </n-space>

      <n-form-item :label="i18n.t('notes')" :show-feedback="false">
        <n-input v-model:value="form.notes" type="textarea" :rows="2" :placeholder="i18n.t('notes')" />
      </n-form-item>

      <n-space justify="end" :size="12">
        <n-button @click="emit('cancel')">{{ i18n.t('cancel') }}</n-button>
        <n-button type="primary" :disabled="!form.number.trim()" @click="handleSubmit">
          {{ submitLabel ?? i18n.t('save') }}
        </n-button>
      </n-space>
    </n-space>
  </n-form>
</template>
