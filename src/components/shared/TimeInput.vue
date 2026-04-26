<script setup lang="ts">
import { computed } from 'vue'
import { NSpace, NInputNumber, NText } from 'naive-ui'

const props = defineProps<{
  value: string | null // Expecting "HH:mm"
}>()

const emit = defineEmits<{
  (e: 'update:value', val: string | null): void
}>()

const hours = computed({
  get: () => {
    if (!props.value) return 0
    return parseInt(props.value.split(':')[0]) || 0
  },
  set: (val: number | null) => {
    const h = (val ?? 0).toString().padStart(2, '0')
    const m = minutes.value.toString().padStart(2, '0')
    emit('update:value', `${h}:${m}`)
  }
})

const minutes = computed({
  get: () => {
    if (!props.value) return 0
    return parseInt(props.value.split(':')[1]) || 0
  },
  set: (val: number | null) => {
    const h = hours.value.toString().padStart(2, '0')
    const m = (val ?? 0).toString().padStart(2, '0')
    emit('update:value', `${h}:${m}`)
  }
})
</script>

<template>
  <n-space :size="4" align="center" inline>
    <n-input-number
      v-model:value="hours"
      :min="0"
      :max="23"
      :show-button="false"
      placeholder="HH"
      style="width: 50px"
      text-align="center"
      :format="(v: number | null) => v !== null ? v.toString().padStart(2, '0') : ''"
    />
    <n-text>:</n-text>
    <n-input-number
      v-model:value="minutes"
      :min="0"
      :max="59"
      :show-button="false"
      placeholder="mm"
      style="width: 50px"
      text-align="center"
      :format="(v: number | null) => v !== null ? v.toString().padStart(2, '0') : ''"
    />
  </n-space>
</template>

<style scoped>
:deep(.n-input-number .n-input__input-el) {
  padding: 0 !important;
}
</style>
