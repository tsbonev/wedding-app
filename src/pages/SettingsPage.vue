<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NButton, NSpace, NTag, NDivider, NText, NPopconfirm
} from 'naive-ui'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import type { GuestGroup } from '@/types'

const config = useAppConfigStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()

// Meal options
const newOptionLabel = ref('')
const newOptionEmoji = ref('🍽️')

function addOption() {
  if (!newOptionLabel.value.trim()) return
  menuStore.addOption(newOptionLabel.value.trim(), newOptionEmoji.value)
  newOptionLabel.value = ''
  newOptionEmoji.value = '🍽️'
}

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
    <h2 style="margin: 0 0 20px;">Settings</h2>

    <!-- Wedding Info -->
    <n-card title="Wedding Info" style="margin-bottom: 20px;">
      <n-form :model="config" label-placement="top">
        <n-form-item label="Couple Name">
          <n-input v-model:value="config.coupleName" placeholder="Alex & Jordan" />
        </n-form-item>
        <n-form-item label="Wedding Date (YYYY-MM-DD)">
          <n-input v-model:value="config.weddingDate as string" placeholder="2026-09-12" />
        </n-form-item>
        <n-form-item label="Venue">
          <n-input v-model:value="config.venue" placeholder="The Grand Ballroom, New York" />
        </n-form-item>
      </n-form>
      <n-text depth="3" style="font-size: 12px;">Changes are saved automatically.</n-text>
    </n-card>

    <!-- Guest Groups -->
    <n-card title="Guest Groups" style="margin-bottom: 20px;">
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
            <label class="color-swatch" :style="{ background: group.color }" title="Change color">
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
              <n-button size="tiny" type="primary" @click="saveEdit(group.id)">Save</n-button>
              <n-button size="tiny" @click="cancelEdit">Cancel</n-button>
            </template>
            <template v-else>
              <n-button size="tiny" @click="startEdit(group)">Edit</n-button>
              <n-popconfirm @positive-click="groupStore.deleteGroup(group.id)">
                <template #trigger>
                  <n-button size="tiny" type="error" ghost>Remove</n-button>
                </template>
                Remove this group? Guests will become ungrouped.
              </n-popconfirm>
            </template>
          </div>
        </div>
      </div>

      <n-text v-if="groupStore.groups.length === 0" depth="3" style="display:block; margin-bottom:12px">
        No groups yet.
      </n-text>

      <n-divider />

      <!-- Add new group -->
      <div class="add-group-row">
        <div class="add-group-color-wrap">
          <span class="field-label">Color</span>
          <label class="color-swatch" :style="{ background: newGroupColor }">
            <input type="color" v-model="newGroupColor" />
          </label>
        </div>
        <div class="add-group-name-wrap">
          <span class="field-label">Name</span>
          <n-input v-model:value="newGroupName" placeholder="e.g. Colleagues" @keyup.enter="addGroup" />
        </div>
        <n-button
          type="primary"
          :disabled="!newGroupName.trim()"
          style="align-self: flex-end"
          @click="addGroup"
        >
          Add Group
        </n-button>
      </div>
    </n-card>

    <!-- Meal Options -->
    <n-card title="Meal Options">
      <n-space wrap style="margin-bottom: 12px;">
        <n-tag
          v-for="opt in menuStore.menuOptions"
          :key="opt.id"
          closable
          @close="menuStore.removeOption(opt.id)"
        >
          {{ opt.emoji }} {{ opt.label }}
        </n-tag>
        <n-text v-if="menuStore.menuOptions.length === 0" depth="3">No meal options yet.</n-text>
      </n-space>
      <n-divider />
      <n-space align="end">
        <n-form-item label="Emoji" style="width: 80px; margin: 0">
          <n-input v-model:value="newOptionEmoji" maxlength="2" />
        </n-form-item>
        <n-form-item label="Label" style="width: 160px; margin: 0">
          <n-input v-model:value="newOptionLabel" placeholder="Chicken" @keyup.enter="addOption" />
        </n-form-item>
        <n-button type="primary" :disabled="!newOptionLabel.trim()" @click="addOption">Add</n-button>
      </n-space>
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  background: #fafafa;
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
  color: #999;
  line-height: 1;
}
</style>
