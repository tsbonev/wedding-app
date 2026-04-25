<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NButton, NSpace, NTag, NDivider, NText
} from 'naive-ui'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useMenuStore } from '@/stores/useMenuStore'

const config = useAppConfigStore()
const menuStore = useMenuStore()

const newOptionLabel = ref('')
const newOptionEmoji = ref('🍽️')

function addOption() {
  if (!newOptionLabel.value.trim()) return
  menuStore.addOption(newOptionLabel.value.trim(), newOptionEmoji.value)
  newOptionLabel.value = ''
  newOptionEmoji.value = '🍽️'
}
</script>

<template>
  <div style="max-width: 560px;">
    <h2 style="margin: 0 0 20px;">Settings</h2>

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
