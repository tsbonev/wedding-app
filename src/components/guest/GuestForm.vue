<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NCheckbox, NPopover, NInputGroup
} from 'naive-ui'
import EmojiPicker from 'vue3-emoji-picker'
// @ts-ignore
import 'vue3-emoji-picker/css'
import type { SelectOption } from 'naive-ui'
import type { Guest, RSVPStatus } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'

const props = defineProps<{
  initial?: Partial<Guest>
  submitLabel?: string
}>()
const emit = defineEmits<{ (e: 'submit', guest: Omit<Guest, 'id' | 'createdAt'>): void; (e: 'cancel'): void }>()

const guestStore = useGuestStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()

const form = ref({
  firstName: props.initial?.firstName ?? '',
  lastName: props.initial?.lastName ?? '',
  rsvpStatus: (props.initial?.rsvpStatus ?? 'pending') as RSVPStatus,
  mealChoiceId: props.initial?.mealChoiceId ?? null as string | null,
  dietaryNotes: props.initial?.dietaryNotes ?? '',
  partnerId: props.initial?.partnerId ?? null as string | null,
  parentId: props.initial?.parentId ?? null as string | null,
  isChild: props.initial?.isChild ?? false,
  isGroom: props.initial?.isGroom ?? false,
  isBride: props.initial?.isBride ?? false,
  customEmoji: props.initial?.customEmoji ?? null as string | null,
  groupId: props.initial?.groupId ?? null as string | null,
  notes: props.initial?.notes ?? '',
  tableId: props.initial?.tableId ?? null as string | null,
  roomId: props.initial?.roomId ?? null as string | null,
})

const rsvpOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Declined', value: 'declined' },
]

const mealOptions = computed(() =>
  menuStore.menuOptions.map((o) => ({ label: `${o.emoji} ${o.label}`, value: o.id }))
)

const groupOptions = computed<SelectOption[]>(() =>
  groupStore.groups.map((g) => ({
    label: g.name,
    value: g.id,
    color: g.color,
  }))
)

const primaryGuestOptions = computed((): (SelectOption & { color?: string | null })[] =>
  guestStore.guests
    .filter((g) => g.id !== props.initial?.id && (!g.partnerId || g.id === props.initial?.partnerId))
    .map((g) => ({
      label: `${g.firstName} ${g.lastName}`,
      value: g.id,
      color: g.groupId ? (groupStore.getById(g.groupId)?.color ?? null) : null,
    }))
)

const parentOptions = computed((): (SelectOption & { color?: string | null })[] =>
  guestStore.guests
    .filter((g) => g.id !== props.initial?.id && (!g.isChild || g.id === props.initial?.parentId))
    .map((g) => ({
      label: `${g.firstName} ${g.lastName}`,
      value: g.id,
      color: g.groupId ? (groupStore.getById(g.groupId)?.color ?? null) : null,
    }))
)

function renderGuestLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex; align-items:center; gap:8px' }, [
    h('span', {
      style: `width:12px; height:12px; border-radius:50%; background:${option.color ?? '#d1d5db'}; display:inline-block; flex-shrink:0`,
    }),
    h('span', String(option.label)),
  ])
}

function renderSingleSelectLabel(option: SelectOption & { color?: string | null }) {
  return h('div', { style: 'display:flex; align-items:center; gap:8px' }, [
    h('span', {
      style: `width:12px; height:12px; border-radius:50%; background:${option.color ?? '#d1d5db'}; display:inline-block; flex-shrink:0`,
    }),
    h('span', String(option.label)),
  ])
}

function onEmojiSelect(emoji: any) {
  form.value.customEmoji = emoji.i
}
</script>

<template>
  <n-form :model="form" label-placement="top">
    <n-space>
      <n-form-item label="First Name" style="flex:1; min-width:140px">
        <n-input v-model:value="form.firstName" placeholder="First name" />
      </n-form-item>
      <n-form-item label="Last Name" style="flex:1; min-width:140px">
        <n-input v-model:value="form.lastName" placeholder="Last name" />
      </n-form-item>
    </n-space>
    <n-form-item label="Group">
      <n-select
        v-model:value="form.groupId"
        :options="groupOptions"
        :render-label="renderGuestLabel"
        :render-label-single="renderSingleSelectLabel"
        filterable
        clearable
        placeholder="Select group"
      />
    </n-form-item>
    <n-form-item label="RSVP Status">
      <n-select v-model:value="form.rsvpStatus" :options="rsvpOptions" />
    </n-form-item>
    <n-form-item label="Meal Choice">
      <n-select v-model:value="form.mealChoiceId" :options="mealOptions" clearable placeholder="Select meal" />
    </n-form-item>
    <n-form-item label="Dietary Notes">
      <n-input v-model:value="form.dietaryNotes" placeholder="Nut allergy, gluten-free, etc." />
    </n-form-item>
    <n-space>
      <n-form-item label="Role">
        <n-space>
          <n-checkbox v-model:checked="form.isGroom">Groom</n-checkbox>
          <n-checkbox v-model:checked="form.isBride">Bride</n-checkbox>
          <n-checkbox v-model:checked="form.isChild">Child</n-checkbox>
        </n-space>
      </n-form-item>
      <n-form-item label="Custom Emoji" style="width: 140px">
        <n-input-group>
          <n-input v-model:value="form.customEmoji" placeholder="e.g. 🐶" clearable />
          <n-popover trigger="click" placement="bottom-end" :width="300" scrollable>
            <template #trigger>
              <n-button ghost style="padding: 0 8px">
                {{ form.customEmoji || '😀' }}
              </n-button>
            </template>
            <EmojiPicker :native="true" @select="onEmojiSelect" />
          </n-popover>
        </n-input-group>
      </n-form-item>
      <n-form-item v-if="form.isChild" label="Parent" style="flex:1; min-width:200px">
        <n-select
          v-model:value="form.parentId"
          :options="parentOptions"
          :render-label="renderGuestLabel"
          :render-label-single="renderSingleSelectLabel"
          filterable
          clearable
          placeholder="Select parent"
        />
      </n-form-item>
    </n-space>
    <n-form-item label="Partner">
      <n-select
        v-model:value="form.partnerId"
        :options="primaryGuestOptions"
        :render-label="renderGuestLabel"
        :render-label-single="renderSingleSelectLabel"
        filterable
        clearable
        placeholder="Select partner"
      />
    </n-form-item>
    <n-form-item label="Notes">
      <n-input v-model:value="form.notes" type="textarea" :rows="2" placeholder="Any notes…" />
    </n-form-item>

    <n-space justify="end">
      <n-button @click="emit('cancel')">Cancel</n-button>
      <n-button
        type="primary"
        :disabled="!form.firstName.trim()"
        @click="emit('submit', form)"
      >
        {{ submitLabel ?? 'Save' }}
      </n-button>
    </n-space>
  </n-form>
</template>
