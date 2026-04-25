<script setup lang="ts">
import { NModal, NCard, NSpace, NButton, NText } from 'naive-ui'
import { useI18nStore } from '@/stores/useI18nStore'

defineProps<{ 
  show: boolean; 
  message?: string;
  confirmText?: string;
  confirmType?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
}>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
const i18n = useI18nStore()
</script>

<template>
  <n-modal :show="show" :mask-closable="false">
    <n-card style="max-width: 400px;" :title="i18n.t('are_you_sure')">
      <n-text>{{ message ?? i18n.t('cannot_be_undone') }}</n-text>
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('cancel')">{{ i18n.t('cancel') }}</n-button>
          <n-button :type="confirmType ?? 'error'" @click="emit('confirm')">
            {{ confirmText ?? i18n.t('delete') }}
          </n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
