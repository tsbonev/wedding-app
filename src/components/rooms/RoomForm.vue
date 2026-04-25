<script setup lang="ts">
import { ref } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSpace, NButton } from 'naive-ui'
import type { Room } from '@/types'

const props = defineProps<{ initial?: Partial<Room>; submitLabel?: string }>()
const emit = defineEmits<{ (e: 'submit', data: Omit<Room, 'id' | 'guestIds'>): void; (e: 'cancel'): void }>()

const form = ref({
  number: props.initial?.number ?? '',
  type: props.initial?.type ?? '',
  capacity: props.initial?.capacity ?? 2,
  checkIn: props.initial?.checkIn ?? null,
  checkOut: props.initial?.checkOut ?? null,
  notes: props.initial?.notes ?? '',
})

function handleSubmit() {
  emit('submit', { ...form.value })
}
</script>

<template>
  <n-form :model="form" label-placement="top">
    <n-space>
      <n-form-item label="Room Number / Name" style="flex:1; min-width:130px">
        <n-input v-model:value="form.number" placeholder="101 / Bridal Suite" />
      </n-form-item>
      <n-form-item label="Type" style="flex:1; min-width:110px">
        <n-input v-model:value="form.type" placeholder="double, single, suite" />
      </n-form-item>
    </n-space>
    <n-form-item label="Capacity">
      <n-input-number v-model:value="form.capacity" :min="1" :max="10" />
    </n-form-item>
    <n-space>
      <n-form-item label="Check-in" style="flex:1">
        <n-input v-model:value="form.checkIn as string" placeholder="YYYY-MM-DD" />
      </n-form-item>
      <n-form-item label="Check-out" style="flex:1">
        <n-input v-model:value="form.checkOut as string" placeholder="YYYY-MM-DD" />
      </n-form-item>
    </n-space>
    <n-form-item label="Notes">
      <n-input v-model:value="form.notes" type="textarea" :rows="2" />
    </n-form-item>
    <n-space justify="end">
      <n-button @click="emit('cancel')">Cancel</n-button>
      <n-button type="primary" :disabled="!form.number.trim()" @click="handleSubmit">
        {{ submitLabel ?? 'Save' }}
      </n-button>
    </n-space>
  </n-form>
</template>
