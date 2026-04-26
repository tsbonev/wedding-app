<script setup lang="ts">
import { computed } from 'vue'
import { NDatePicker, NSpace } from 'naive-ui'
import TimeInput from './TimeInput.vue'

const props = defineProps<{
  value: string | null // Expecting "yyyy-MM-dd HH:mm"
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', val: string | null): void
}>()

const dateValue = computed({
  get: () => {
    if (!props.value) return null
    return props.value.split(' ')[0]
  },
  set: (val: string | null) => {
    if (!val) {
      emit('update:value', null)
      return
    }
    const time = timeValue.value || '12:00'
    emit('update:value', `${val} ${time}`)
  }
})

const timeValue = computed({
  get: () => {
    if (!props.value) return '12:00'
    const parts = props.value.split(' ')
    return parts.length > 1 ? parts[1] : '12:00'
  },
  set: (val: string | null) => {
    const date = dateValue.value || new Date().toISOString().split('T')[0]
    const time = val || '00:00'
    emit('update:value', `${date} ${time}`)
  }
})
</script>

<template>
  <n-space :size="8" align="center" inline>
    <n-date-picker
      v-model:formatted-value="dateValue"
      value-format="yyyy-MM-dd"
      type="date"
      :placeholder="placeholder"
      update-value-on-close
      style="width: 140px"
    />
    <TimeInput v-model:value="timeValue" />
  </n-space>
</template>
