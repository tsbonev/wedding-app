<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NButton, NCheckbox } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { TableShape } from '@/types'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const seatingStore = useSeatingStore()
const i18n = useI18nStore()

const form = ref({
  name: '',
  shape: 'round' as TableShape,
  capacity: 8,
  widthCm: null as number | null,
  lengthCm: null as number | null,
  oneSided: false,
})

const shapeOptions = computed(() => [
  { label: `⚪ ${i18n.t('round')}`, value: 'round' },
  { label: `⬜ ${i18n.t('rectangular')}`, value: 'rectangular' },
])

watch(() => form.value.shape, (s) => {
  if (s === 'round') {
    form.value.widthCm = null
    form.value.lengthCm = null
    form.value.oneSided = false
  }
})

function handleAdd() {
  if (!form.value.name.trim()) return
  seatingStore.addTable({ ...form.value })
  form.value = { name: '', shape: 'round', capacity: 8, widthCm: null, lengthCm: null, oneSided: false }
  emit('close')
}
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card :title="i18n.t('add_table')" style="max-width: 380px; width: 95vw;" closable @close="emit('close')">
      <n-form :model="form" label-placement="top">
        <n-form-item :label="i18n.t('table_name')">
          <n-input v-model:value="form.name" :placeholder="i18n.t('table_name')" />
        </n-form-item>
        <n-form-item :label="i18n.t('shape')">
          <n-select v-model:value="form.shape" :options="shapeOptions" />
        </n-form-item>
        <n-form-item :label="i18n.t('seats')">
          <n-input-number v-model:value="form.capacity" :min="1" :max="40" />
        </n-form-item>
        <template v-if="form.shape === 'rectangular'">
          <n-space :wrap="false">
            <n-form-item :label="i18n.t('length_cm')" style="flex:1">
              <n-input-number v-model:value="form.lengthCm" :min="1" :placeholder="i18n.t('length_cm')" style="width:100%" />
            </n-form-item>
            <n-form-item :label="i18n.t('width_cm')" style="flex:1">
              <n-input-number v-model:value="form.widthCm" :min="1" :placeholder="i18n.t('width_cm')" style="width:100%" />
            </n-form-item>
          </n-space>
          <n-form-item>
            <n-checkbox v-model:checked="form.oneSided">{{ i18n.t('one_sided_table') }}</n-checkbox>
          </n-form-item>
        </template>
        <n-space justify="end">
          <n-button @click="emit('close')">{{ i18n.t('cancel') }}</n-button>
          <n-button type="primary" :disabled="!form.name.trim()" @click="handleAdd">{{ i18n.t('add_table') }}</n-button>
        </n-space>
      </n-form>
    </n-card>
  </n-modal>
</template>
