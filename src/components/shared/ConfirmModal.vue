<script setup lang="ts">
import { NModal, NCard, NSpace, NButton, NText } from 'naive-ui'

defineProps<{ 
  show: boolean; 
  message?: string;
  confirmText?: string;
  confirmType?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
}>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card style="max-width: 400px;" title="Are you sure?">
      <n-text>{{ message ?? 'This action cannot be undone.' }}</n-text>
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('cancel')">Cancel</n-button>
          <n-button :type="confirmType ?? 'error'" @click="emit('confirm')">
            {{ confirmText ?? 'Delete' }}
          </n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
