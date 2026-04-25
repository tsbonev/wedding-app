<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace, NCheckbox, NPopover, NInputGroup
} from 'naive-ui'
import EmojiPicker from 'vue3-emoji-picker'
// @ts-ignore
import 'vue3-emoji-picker/css'
import type { SelectOption } from 'naive-ui'
import type { Guest, RSVPStatus, MenuItem } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useI18nStore } from '@/stores/useI18nStore'

const props = defineProps<{
  initial?: Partial<Guest>
  submitLabel?: string
}>()
const emit = defineEmits<{ (e: 'submit', guest: Omit<Guest, 'id' | 'createdAt'>): void; (e: 'cancel'): void }>()

const guestStore = useGuestStore()
const menuStore = useMenuStore()
const groupStore = useGroupStore()
const i18n = useI18nStore()

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
  isChildrenSeatAdjoining: props.initial?.isChildrenSeatAdjoining ?? false,
})

const rsvpOptions = computed(() => [
  { label: i18n.t('pending'), value: 'pending' },
  { label: i18n.t('confirmed'), value: 'confirmed' },
  { label: i18n.t('declined'), value: 'declined' },
])

const mealOptions = computed(() =>
  menuStore.menuOptions.map((o: MenuItem) => ({ label: `${o.emoji} ${o.label}`, value: o.id }))
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
      <n-form-item :label="i18n.t('first_name')" style="flex:1; min-width:140px">
        <n-input v-model:value="form.firstName" :placeholder="i18n.t('first_name')" />
      </n-form-item>
      <n-form-item :label="i18n.t('last_name')" style="flex:1; min-width:140px">
        <n-input v-model:value="form.lastName" :placeholder="i18n.t('last_name')" />
      </n-form-item>
    </n-space>
    <n-form-item :label="i18n.t('group')">
      <n-select
        v-model:value="form.groupId"
        :options="groupOptions"
        :render-label="renderGuestLabel"
        :render-label-single="renderSingleSelectLabel"
        filterable
        clearable
        :placeholder="i18n.t('select_group')"
      />
    </n-form-item>
    <n-form-item :label="i18n.t('rsvp_status')">
      <n-select v-model:value="form.rsvpStatus" :options="rsvpOptions" />
    </n-form-item>
    <n-form-item :label="i18n.t('meal_choice')">
      <n-select v-model:value="form.mealChoiceId" :options="mealOptions" clearable :placeholder="i18n.t('select_meal')" />
    </n-form-item>
    <n-form-item :label="i18n.t('dietary_notes')">
      <n-input v-model:value="form.dietaryNotes" :placeholder="i18n.t('dietary_notes')" />
    </n-form-item>
    <n-space>
      <n-form-item :label="i18n.t('role')">
        <n-space>
          <n-checkbox v-model:checked="form.isGroom">{{ i18n.t('groom') }}</n-checkbox>
          <n-checkbox v-model:checked="form.isBride">{{ i18n.t('bride') }}</n-checkbox>
          <n-checkbox v-model:checked="form.isChild">{{ i18n.t('child') }}</n-checkbox>
        </n-space>
      </n-form-item>
      <n-form-item :label="i18n.t('custom_emoji')" style="width: 140px">
        <n-input-group>
          <n-input v-model:value="form.customEmoji" :placeholder="i18n.t('placeholder_emoji')" clearable />
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
      <n-form-item v-if="form.isChild" :label="i18n.t('parent')" style="flex:1; min-width:200px">
        <n-space vertical>
          <n-select
            v-model:value="form.parentId"
            :options="parentOptions"
            :render-label="renderGuestLabel"
            :render-label-single="renderSingleSelectLabel"
            filterable
            clearable
            :placeholder="i18n.t('select_parent')"
          />
          <n-checkbox v-if="form.parentId" v-model:checked="form.isChildrenSeatAdjoining">
            {{ i18n.t('adjoining_seat') }}
          </n-checkbox>
        </n-space>
      </n-form-item>
    </n-space>
    <n-form-item :label="i18n.t('partner')">
      <n-select
        v-model:value="form.partnerId"
        :options="primaryGuestOptions"
        :render-label="renderGuestLabel"
        :render-label-single="renderSingleSelectLabel"
        filterable
        clearable
        :placeholder="i18n.t('select_partner')"
      />
    </n-form-item>
    <n-form-item :label="i18n.t('notes')">
      <n-input v-model:value="form.notes" type="textarea" :rows="2" :placeholder="i18n.t('notes')" />
    </n-form-item>

    <n-space justify="end">
      <n-button @click="emit('cancel')">{{ i18n.t('cancel') }}</n-button>
      <n-button
        type="primary"
        :disabled="!form.firstName.trim()"
        @click="emit('submit', form)"
      >
        {{ submitLabel ?? i18n.t('save') }}
      </n-button>
    </n-space>
  </n-form>
</template>
