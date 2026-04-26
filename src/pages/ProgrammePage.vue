<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSpace, NButton, NTimeline, NTimelineItem, NModal, NForm, NFormItem, NInput, NTimePicker, NPopconfirm, NText } from 'naive-ui'
import { useProgrammeStore } from '@/stores/useProgrammeStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import EmptyState from '@/components/shared/EmptyState.vue'
import type { ProgrammeEvent } from '@/types'

const programmeStore = useProgrammeStore()
const i18n = useI18nStore()
const configStore = useAppConfigStore()

const showModal = ref(false)
const editingEvent = ref<ProgrammeEvent | null>(null)

const formModel = ref({
  time: '12:00',
  name: '',
  description: ''
})

const timeValue = ref<number | null>(null)

const formattedWeddingDate = computed(() => {
  if (!configStore.weddingDate) return null
  const date = new Date(configStore.weddingDate)
  return date.toLocaleDateString(i18n.locale === 'bg' ? 'bg-BG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function openAdd() {
  editingEvent.value = null
  formModel.value = {
    time: '12:00',
    name: '',
    description: ''
  }
  timeValue.value = parseTime('12:00')
  showModal.value = true
}

function openEdit(event: ProgrammeEvent) {
  editingEvent.value = event
  formModel.value = {
    time: event.time,
    name: event.name,
    description: event.description
  }
  timeValue.value = parseTime(event.time)
  showModal.value = true
}

function handleSave() {
  if (timeValue.value) {
    formModel.value.time = formatTime(timeValue.value)
  }
  
  if (editingEvent.value) {
    programmeStore.updateEvent(editingEvent.value.id, { ...formModel.value })
  } else {
    programmeStore.addEvent({ ...formModel.value })
  }
  showModal.value = false
}

function handleDelete(id: string) {
  programmeStore.removeEvent(id)
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="programme-page">
    <div class="print-header">
      <h1 v-if="configStore.coupleName">{{ configStore.coupleName }}</h1>
      <div class="print-meta">
        <span v-if="formattedWeddingDate"><strong>{{ i18n.t('date') }}:</strong> {{ formattedWeddingDate }}</span>
        <span v-if="configStore.venue"><strong>{{ i18n.t('venue_label') }}:</strong> {{ configStore.venue }}</span>
      </div>
      <h2 style="margin-top: 10px;">{{ i18n.t('programme') }}</h2>
    </div>

    <n-space justify="space-between" align="center" style="margin-bottom: 16px;" class="no-print">
      <div>
        <h2 style="margin: 0;">{{ i18n.t('programme') }}</h2>
        <n-text v-if="formattedWeddingDate" depth="3">{{ formattedWeddingDate }}</n-text>
      </div>
      <n-space>
        <n-button type="info" secondary @click="handlePrint">🖨️ {{ i18n.t('print') }}</n-button>
        <n-button type="primary" @click="openAdd">+ {{ i18n.t('add_event') }}</n-button>
      </n-space>
    </n-space>

    <div v-if="programmeStore.sortedEvents.length > 0" class="programme-content">
      <n-timeline size="large">
        <n-timeline-item
          v-for="event in programmeStore.sortedEvents"
          :key="event.id"
        >
          <template #header>
            <n-space align="center" :wrap="false">
              <n-text strong class="event-time">{{ event.time }}</n-text>
              <n-text strong class="event-name">{{ event.name }}</n-text>
            </n-space>
          </template>
          <n-text depth="3" class="event-description">{{ event.description }}</n-text>
          <template #footer>
            <n-space class="no-print" style="margin-top: 8px;">
              <n-button size="tiny" tertiary @click="openEdit(event)">
                {{ i18n.t('edit') }}
              </n-button>
              <n-popconfirm @positive-click="handleDelete(event.id)">
                <template #trigger>
                  <n-button size="tiny" tertiary type="error">
                    {{ i18n.t('delete') }}
                  </n-button>
                </template>
                {{ i18n.t('delete_confirm_event') }}
              </n-popconfirm>
            </n-space>
          </template>
        </n-timeline-item>
      </n-timeline>
    </div>

    <EmptyState
      v-else
      icon="📅"
      :title="i18n.t('no_events_yet')"
      :description="i18n.t('no_events_description')"
      class="no-print"
    >
      <n-button type="primary" @click="openAdd" style="margin-top: 16px;">
        + {{ i18n.t('add_event') }}
      </n-button>
    </EmptyState>

    <n-modal v-model:show="showModal" preset="card" :title="editingEvent ? i18n.t('edit_event') : i18n.t('add_event')" style="width: 500px; max-width: 90vw;">
      <n-form :model="formModel">
        <n-form-item :label="i18n.t('event_time')">
          <n-time-picker v-model:value="timeValue" format="HH:mm" style="width: 100%;" />
        </n-form-item>
        <n-form-item :label="i18n.t('event_name')">
          <n-input v-model:value="formModel.name" :placeholder="i18n.t('event_name')" />
        </n-form-item>
        <n-form-item :label="i18n.t('event_description')">
          <n-input
            v-model:value="formModel.description"
            type="textarea"
            :placeholder="i18n.t('event_description')"
            :autosize="{ minRows: 2, maxRows: 5 }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">{{ i18n.t('cancel') }}</n-button>
          <n-button type="primary" @click="handleSave" :disabled="!formModel.name">{{ i18n.t('save') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.programme-page {
  max-width: 800px;
  margin: 0 auto;
}

.print-header {
  display: none;
}

@media print {
  .print-header {
    display: block;
    margin-bottom: 30px;
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 15px;
  }
  .print-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 14px;
  }
  .programme-page {
    max-width: 100%;
  }
  .no-print {
    display: none !important;
  }
}

.event-time {
  font-size: 1.2em;
  min-width: 70px;
  color: var(--n-title-text-color);
}

.event-name {
  font-size: 1.2em;
}

.event-description {
  display: block;
  margin-top: 4px;
}
</style>
