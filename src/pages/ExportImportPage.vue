<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NCard, NButton, NSpace, NText, NAlert, NUpload, NUploadDragger } from 'naive-ui'
import { useStateSnapshot } from '@/composables/useStateSnapshot'
import { useI18nStore } from '@/stores/useI18nStore'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'

const { exportSnapshot, importSnapshot } = useStateSnapshot()
const i18n = useI18nStore()

const pendingFile = ref<File | null>(null)
const showConfirm = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function handleFileChange(data: { file: UploadFileInfo }) {
  if (data.file.file) {
    pendingFile.value = data.file.file
    showConfirm.value = true
  }
}

async function confirmImport() {
  showConfirm.value = false
  if (!pendingFile.value) return
  errorMsg.value = ''
  successMsg.value = ''
  const err = await importSnapshot(pendingFile.value)
  if (err) errorMsg.value = err
  else successMsg.value = i18n.t('import_success')
  pendingFile.value = null
}
</script>

<template>
  <div style="max-width: 560px;">
    <h2 style="margin: 0 0 20px;">{{ i18n.t('export_import') }}</h2>

    <n-card :title="i18n.t('export')" style="margin-bottom: 20px;">
      <n-space vertical>
        <n-text>{{ i18n.t('export_description') }}</n-text>
        <n-button type="primary" @click="exportSnapshot">⬇️ {{ i18n.t('download_json') }}</n-button>
      </n-space>
    </n-card>

    <n-card :title="i18n.t('import')">
      <n-space vertical>
        <n-alert type="warning" :title="i18n.t('warning')" :show-icon="true">
          <span v-html="i18n.t('import_warning')"></span>
        </n-alert>

        <n-alert v-if="errorMsg" type="error">{{ errorMsg }}</n-alert>
        <n-alert v-if="successMsg" type="success">{{ successMsg }}</n-alert>

        <n-upload
          accept=".json"
          :show-file-list="false"
          @change="handleFileChange"
        >
          <n-upload-dragger>
            <div style="padding: 24px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
              <n-text>{{ i18n.t('drop_json') }}</n-text>
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-space>
    </n-card>

    <ConfirmModal
      :show="showConfirm"
      :message="i18n.t('import_confirm_message')"
      :confirm-text="i18n.t('replace')"
      confirm-type="warning"
      @confirm="confirmImport"
      @cancel="showConfirm = false; pendingFile = null"
    />
  </div>
</template>
