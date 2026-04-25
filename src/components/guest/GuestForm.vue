<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NForm, NFormItem, NInput, NSelect, NButton, NSpace
} from 'naive-ui'
import type { Guest, RSVPStatus } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'

const props = defineProps<{
  initial?: Partial<Guest>
  submitLabel?: string
}>()
const emit = defineEmits<{ (e: 'submit', guest: Omit<Guest, 'id' | 'createdAt'>): void; (e: 'cancel'): void }>()

const guestStore = useGuestStore()
const menuStore = useMenuStore()

const form = ref({
  firstName: props.initial?.firstName ?? '',
  lastName: props.initial?.lastName ?? '',
  email: props.initial?.email ?? '',
  phone: props.initial?.phone ?? '',
  rsvpStatus: (props.initial?.rsvpStatus ?? 'pending') as RSVPStatus,
  mealChoiceId: props.initial?.mealChoiceId ?? null as string | null,
  dietaryNotes: props.initial?.dietaryNotes ?? '',
  plusOneOf: props.initial?.plusOneOf ?? null as string | null,
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

const primaryGuestOptions = computed(() =>
  guestStore.guests
    .filter((g) => !g.plusOneOf && g.id !== props.initial?.id)
    .map((g) => ({ label: `${g.firstName} ${g.lastName}`, value: g.id }))
)
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
    <n-form-item label="Email">
      <n-input v-model:value="form.email" placeholder="email@example.com" />
    </n-form-item>
    <n-form-item label="Phone">
      <n-input v-model:value="form.phone" placeholder="+1 555 000 0000" />
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
    <n-form-item label="Plus-one of">
      <n-select
        v-model:value="form.plusOneOf"
        :options="primaryGuestOptions"
        clearable
        placeholder="Select primary guest (if this is a +1)"
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
