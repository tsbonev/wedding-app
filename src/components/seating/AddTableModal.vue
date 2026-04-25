<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NButton } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import type { TableShape } from '@/types'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const seatingStore = useSeatingStore()

const form = ref({ name: '', shape: 'round' as TableShape, capacity: 8 })
const shapeOptions = [
  { label: '⭕ Round', value: 'round' },
  { label: '⬜ Rectangular', value: 'rectangular' },
]

function handleAdd() {
  if (!form.value.name.trim()) return
  seatingStore.addTable({ ...form.value })
  form.value = { name: '', shape: 'round', capacity: 8 }
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card title="Add Table" style="max-width: 360px; width: 95vw;" closable @close="emit('close')">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Table Name">
          <n-input v-model:value="form.name" placeholder="e.g. Table 1, Head Table" />
        </n-form-item>
        <n-form-item label="Shape">
          <n-select v-model:value="form.shape" :options="shapeOptions" />
        </n-form-item>
        <n-form-item label="Seats">
          <n-input-number v-model:value="form.capacity" :min="1" :max="30" />
        </n-form-item>
        <n-space justify="end">
          <n-button @click="emit('close')">Cancel</n-button>
          <n-button type="primary" :disabled="!form.name.trim()" @click="handleAdd">Add Table</n-button>
        </n-space>
      </n-form>
    </n-card>
  </n-modal>
</template>
