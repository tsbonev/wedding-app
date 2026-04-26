<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NButton, NDivider, NText, NPopconfirm
} from 'naive-ui'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { GuestGroup } from '@/types'

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
          <n-input v-model:value="config.weddingDate as string" :placeholder="i18n.t('placeholder_date')" />
        </n-form-item>
        <n-form-item :label="i18n.t('venue')">
          <n-input v-model:value="config.venue" :placeholder="i18n.t('venue')" />
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
