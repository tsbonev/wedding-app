<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NButton, NDivider, NText, NPopconfirm, NDatePicker,
  NCheckbox, NSelect, NAlert, NSpin, NList, NListItem, NThing, NSpace,
} from 'naive-ui'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCloudSync } from '@/composables/useCloudSync'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import type { GuestGroup } from '@/types'
import type { CloudSnapshot } from '@/composables/useCloudSync'

const config = useAppConfigStore()
const groupStore = useGroupStore()
const i18n = useI18nStore()

// Group add
const newGroupName = ref('')
const newGroupColor = ref('#6366f1')

function addGroup() {
  if (!newGroupName.value.trim()) return
  groupStore.addGroup(newGroupName.value.trim(), newGroupColor.value)
  newGroupName.value = ''
  newGroupColor.value = '#6366f1'
}

// Group inline rename
const editingGroupId = ref<string | null>(null)
const editingGroupName = ref('')

function startEdit(group: GuestGroup) {
  editingGroupId.value = group.id
  editingGroupName.value = group.name
}

function saveEdit(id: string) {
  if (editingGroupName.value.trim()) {
    groupStore.updateGroup(id, { name: editingGroupName.value.trim() })
  }
  editingGroupId.value = null
}

function cancelEdit() {
  editingGroupId.value = null
}

// Wedding Info
const weddingDateValue = computed({
  get: () => {
    if (!config.weddingDate) return null
    return new Date(config.weddingDate).getTime()
  },
  set: (val: number | null) => {
    config.weddingDate = val ? new Date(val).toISOString() : null
  }
})

const currencyOptions = computed(() => [
  { label: `€ ${i18n.t('currency_eur')}`, value: 'EUR' },
  { label: `$ ${i18n.t('currency_usd')}`, value: 'USD' },
])

// Cloud sync
const authStore = useAuthStore()
const { isSaving, lastSavedAt, saveSnapshot, listSnapshots, restoreSnapshot, startAutoSave } = useCloudSync()

const cloudSnapshots = ref<CloudSnapshot[]>([])
const loadingHistory = ref(false)
const cloudError = ref('')
const cloudSuccess = ref('')
const showRestoreConfirm = ref(false)
const pendingRestore = ref<CloudSnapshot | null>(null)

const allowedEmails = ref<string[]>([])
const newAllowedEmail = ref('')
const allowlistError = ref('')

async function refreshHistory() {
  if (!authStore.user) return
  loadingHistory.value = true
  try { cloudSnapshots.value = await listSnapshots() }
  catch { cloudError.value = i18n.t('cloud_error_history') }
  finally { loadingHistory.value = false }
}

async function loadAllowlist() {
  const snap = await getDocs(collection(db, 'allowedEmails'))
  allowedEmails.value = snap.docs.map(d => d.id)
}

async function addAllowedEmail() {
  const email = newAllowedEmail.value.trim().toLowerCase()
  if (!email || !email.includes('@')) { allowlistError.value = i18n.t('cloud_invalid_email'); return }
  allowlistError.value = ''
  await setDoc(doc(db, 'allowedEmails', email), { allowed: true })
  newAllowedEmail.value = ''
  await loadAllowlist()
}

async function removeAllowedEmail(email: string) {
  await deleteDoc(doc(db, 'allowedEmails', email))
  await loadAllowlist()
}

async function handleSave() {
  cloudError.value = ''; cloudSuccess.value = ''
  try {
    await saveSnapshot()
    cloudSuccess.value = i18n.t('cloud_success_saved')
    await refreshHistory()
  } catch { cloudError.value = i18n.t('cloud_error_save') }
}

function promptRestore(snap: CloudSnapshot) {
  pendingRestore.value = snap
  showRestoreConfirm.value = true
}

function confirmRestore() {
  if (pendingRestore.value) restoreSnapshot(pendingRestore.value.snapshot)
  showRestoreConfirm.value = false
  pendingRestore.value = null
  cloudSuccess.value = i18n.t('cloud_restored')
}

onMounted(() => {
  if (authStore.user) { refreshHistory(); loadAllowlist(); startAutoSave() }
})

watch(() => authStore.user, (u) => { if (u) { refreshHistory(); loadAllowlist() } })
</script>

<template>
  <div style="max-width: 600px;">
    <h2 style="margin: 0 0 20px;">{{ i18n.t('settings') }}</h2>

    <!-- Wedding Info -->
    <n-card :title="i18n.t('wedding_info')" style="margin-bottom: 20px;">
      <n-form :model="config" label-placement="top">
        <n-form-item :label="i18n.t('couple_name')">
          <n-input v-model:value="config.coupleName" :placeholder="i18n.t('placeholder_couple')" />
        </n-form-item>
        <n-form-item :label="i18n.t('wedding_date_format')">
          <n-date-picker
            v-model:value="weddingDateValue"
            type="datetime"
            style="width: 100%"
            :placeholder="i18n.t('placeholder_date')"
            update-value-on-close
          />
        </n-form-item>
        <n-form-item :label="i18n.t('venue')">
          <n-input v-model:value="config.venue" :placeholder="i18n.t('venue')" />
        </n-form-item>
        <n-form-item :label="i18n.t('currency')">
          <n-select v-model:value="config.currency" :options="currencyOptions" />
        </n-form-item>
        <n-form-item :label="i18n.t('budget_visibility')">
          <n-checkbox v-model:checked="config.showBudgetOnDashboard">
            {{ i18n.t('show_budget_prices_dashboard') }}
          </n-checkbox>
        </n-form-item>
      </n-form>
      <n-text depth="3" style="font-size: 12px;">{{ i18n.t('saved_automatically') }}</n-text>
    </n-card>

    <!-- Guest Groups -->
    <n-card :title="i18n.t('guest_groups')" style="margin-bottom: 20px;">
      <div class="group-grid">
        <div v-for="group in groupStore.groups" :key="group.id" class="group-card">

          <!-- Name + color swatch row -->
          <div class="group-card-top">
            <n-input
              v-if="editingGroupId === group.id"
              v-model:value="editingGroupName"
              size="small"
              style="flex: 1; min-width: 0"
              @keyup.enter="saveEdit(group.id)"
              @keyup.escape="cancelEdit"
            />
            <span v-else class="group-card-name">{{ group.name }}</span>
            <label class="color-swatch" :style="{ background: group.color }" :title="i18n.t('change_color')">
              <input
                type="color"
                :value="group.color"
                @input="(e) => groupStore.updateGroup(group.id, { color: (e.target as HTMLInputElement).value })"
              />
            </label>
          </div>

          <!-- Actions -->
          <div class="group-card-actions">
            <template v-if="editingGroupId === group.id">
              <n-button size="tiny" type="primary" @click="saveEdit(group.id)">{{ i18n.t('save') }}</n-button>
              <n-button size="tiny" @click="cancelEdit">{{ i18n.t('cancel') }}</n-button>
            </template>
            <template v-else>
              <n-button size="tiny" @click="startEdit(group)">{{ i18n.t('edit') }}</n-button>
              <n-popconfirm @positive-click="groupStore.deleteGroup(group.id)">
                <template #trigger>
                  <n-button size="tiny" type="error" ghost>{{ i18n.t('remove') }}</n-button>
                </template>
                {{ i18n.t('remove_group_confirm') }}
              </n-popconfirm>
            </template>
          </div>
        </div>
      </div>

      <n-text v-if="groupStore.groups.length === 0" depth="3" style="display:block; margin-bottom:12px">
        {{ i18n.t('no_groups_yet') }}
      </n-text>

      <n-divider />

      <!-- Add new group -->
      <div class="add-group-row">
        <div class="add-group-color-wrap">
          <span class="field-label">{{ i18n.t('color') }}</span>
          <label class="color-swatch" :style="{ background: newGroupColor }">
            <input type="color" v-model="newGroupColor" />
          </label>
        </div>
        <div class="add-group-name-wrap">
          <span class="field-label">{{ i18n.t('name') }}</span>
          <n-input v-model:value="newGroupName" :placeholder="i18n.t('name')" @keyup.enter="addGroup" />
        </div>
        <n-button
          type="primary"
          :disabled="!newGroupName.trim()"
          style="align-self: flex-end"
          @click="addGroup"
        >
          {{ i18n.t('add_group') }}
        </n-button>
      </div>
    </n-card>

    <!-- Cloud Sync Auth -->
    <n-card :title="i18n.t('cloud_sync')" style="margin-bottom: 20px;">
      <n-space vertical>
        <template v-if="authStore.isLoading">
          <n-space align="center"><n-spin size="small" /><n-text>{{ i18n.t('cloud_checking') }}</n-text></n-space>
        </template>
        <template v-else-if="!authStore.user">
          <n-alert v-if="authStore.accessDenied" type="error" style="margin-bottom: 8px;">
            {{ i18n.t('cloud_access_denied') }}
          </n-alert>
          <n-text>{{ i18n.t('cloud_sign_in_description') }}</n-text>
          <n-button type="primary" style="margin-top: 8px;" @click="authStore.signIn">{{ i18n.t('cloud_sign_in') }}</n-button>
        </template>
        <template v-else>
          <n-text>{{ i18n.t('cloud_signed_in_as') }} <strong>{{ authStore.user.email }}</strong></n-text>
          <n-button style="margin-top: 8px;" @click="authStore.signOut">{{ i18n.t('cloud_sign_out') }}</n-button>
        </template>
      </n-space>
    </n-card>

    <!-- Cloud Saves -->
    <n-card v-if="authStore.user" :title="i18n.t('cloud_saves')" style="margin-bottom: 20px;">
      <n-space vertical>
        <n-alert v-if="cloudError" type="error" closable @close="cloudError = ''">{{ cloudError }}</n-alert>
        <n-alert v-if="cloudSuccess" type="success" closable @close="cloudSuccess = ''">{{ cloudSuccess }}</n-alert>

        <n-space align="center">
          <n-button type="primary" :loading="isSaving" @click="handleSave">{{ i18n.t('cloud_save_button') }}</n-button>
          <n-text v-if="lastSavedAt" depth="3" style="font-size: 12px;">
            {{ i18n.t('cloud_last_saved') }} {{ lastSavedAt.toLocaleString() }}
          </n-text>
        </n-space>

        <n-divider />
        <n-text strong>{{ i18n.t('cloud_version_history') }}</n-text>
        <n-spin v-if="loadingHistory" />
        <n-text v-else-if="!cloudSnapshots.length" depth="3">{{ i18n.t('cloud_no_saves') }}</n-text>
        <n-list v-else bordered>
          <n-list-item v-for="snap in cloudSnapshots" :key="snap.id">
            <n-thing :title="snap.savedAt.toLocaleString()" :description="i18n.t('cloud_saved_by') + ' ' + snap.savedBy" />
            <template #suffix>
              <n-button size="small" @click="promptRestore(snap)">{{ i18n.t('cloud_restore') }}</n-button>
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-card>

    <!-- Allowed Accounts -->
    <n-card v-if="authStore.user" :title="i18n.t('cloud_allowed_accounts')" style="margin-bottom: 20px;">
      <n-space vertical>
        <n-alert v-if="allowlistError" type="error" closable @close="allowlistError = ''">{{ allowlistError }}</n-alert>
        <n-list bordered>
          <n-list-item v-for="email in allowedEmails" :key="email">
            <n-text>{{ email }}</n-text>
            <template #suffix>
              <n-button
                size="small"
                type="error"
                ghost
                :disabled="email === authStore.user!.email"
                @click="removeAllowedEmail(email)"
              >
                {{ i18n.t('remove') }}
              </n-button>
            </template>
          </n-list-item>
        </n-list>
        <n-space align="flex-end" style="margin-top: 8px;">
          <n-input v-model:value="newAllowedEmail" :placeholder="i18n.t('cloud_placeholder_email')" style="width: 260px;" @keyup.enter="addAllowedEmail" />
          <n-button @click="addAllowedEmail">{{ i18n.t('cloud_add_account') }}</n-button>
        </n-space>
      </n-space>
    </n-card>

    <ConfirmModal
      :show="showRestoreConfirm"
      :message="i18n.t('cloud_restore_confirm')"
      :confirm-text="i18n.t('cloud_restore')"
      confirm-type="warning"
      @confirm="confirmRestore"
      @cancel="showRestoreConfirm = false; pendingRestore = null"
    />
  </div>
</template>

<style scoped>
/* Group cards grid */
.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.group-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--bg-muted);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.group-card-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-card-actions {
  display: flex;
  gap: 6px;
}

/* Native color swatch */
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  flex-shrink: 0;
  display: block;
  position: relative;
  transition: border-color 0.15s;
}
.color-swatch:hover {
  border-color: rgba(0, 0, 0, 0.3);
}
.color-swatch input[type='color'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  padding: 0;
  border: none;
}

/* Add group form row */
.add-group-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.add-group-color-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.add-group-name-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1;
}
</style>
