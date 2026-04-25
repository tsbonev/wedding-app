<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NCard, NButton, NSpace, NText, NAlert, NUpload, NUploadDragger } from 'naive-ui'
import { useStateSnapshot } from '@/composables/useStateSnapshot'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'

const { exportSnapshot, importSnapshot } = useStateSnapshot()

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
  else successMsg.value = 'Data imported successfully!'
  pendingFile.value = null
}
</script>

<template>
  <div style="max-width: 560px;">
    <h2 style="margin: 0 0 20px;">Export / Import</h2>

    <n-card title="Export" style="margin-bottom: 20px;">
      <n-space vertical>
        <n-text>Download a complete snapshot of all your wedding data as a JSON file. Use this for backups or to transfer data to another device.</n-text>
        <n-button type="primary" @click="exportSnapshot">⬇️ Download JSON</n-button>
      </n-space>
    </n-card>

    <n-card title="Import">
      <n-space vertical>
        <n-alert type="warning" title="Warning" :show-icon="true">
          Importing will <strong>replace all current data</strong>. Export first if you want a backup.
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
              <n-text>Drop a wedding JSON file here, or click to select</n-text>
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-space>
    </n-card>

    <ConfirmModal
      :show="showConfirm"
      message="This will replace ALL current data with the contents of the imported file. This cannot be undone."
      @confirm="confirmImport"
      @cancel="showConfirm = false; pendingFile = null"
    />
  </div>
</template>
