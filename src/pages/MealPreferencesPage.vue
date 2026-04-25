<script setup lang="ts">
import { computed, h } from 'vue'
import { NSpace, NCard, NProgress, NText, NDataTable, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import type { Guest } from '@/types'
import RSVPBadge from '@/components/shared/RSVPBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const guestStore = useGuestStore()
const menuStore = useMenuStore()

const confirmedGuests = computed(() => guestStore.guests.filter((g) => g.rsvpStatus === 'confirmed'))

const mealCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const opt of menuStore.menuOptions) counts[opt.id] = 0
  counts['none'] = 0
  for (const g of confirmedGuests.value) {
    if (g.mealChoiceId && counts[g.mealChoiceId] !== undefined) counts[g.mealChoiceId]++
    else counts['none']++
  }
  return counts
})

const columns: DataTableColumns<Guest> = [
  { title: 'Name', key: 'name', render: (r) => `${r.firstName} ${r.lastName}` },
  { title: 'RSVP', key: 'rsvp', width: 110, render: (r) => h(RSVPBadge, { status: r.rsvpStatus }) },
  {
    title: 'Meal',
    key: 'meal',
    render: (r) => {
      const opts = menuStore.menuOptions.map((o) => ({ label: `${o.emoji} ${o.label}`, value: o.id }))
      return h(NSelect, {
        value: r.mealChoiceId,
        options: opts,
        clearable: true,
        placeholder: 'Select meal',
        style: 'min-width: 160px',
        'onUpdate:value': (val: string | null) => guestStore.updateGuest(r.id, { mealChoiceId: val }),
      })
    },
  },
  { title: 'Dietary Notes', key: 'dietaryNotes', render: (r) => r.dietaryNotes || '—' },
]
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px;">Meal Preferences</h2>

    <EmptyState
      v-if="guestStore.guests.length === 0"
      icon="🍽️"
      title="No guests yet"
      description="Add guests first, then assign meal preferences here."
    />

    <n-space v-else vertical :size="24">
      <n-card title="Summary">
        <n-space vertical>
          <div v-for="opt in menuStore.menuOptions" :key="opt.id">
            <n-text>{{ opt.emoji }} {{ opt.label }}: {{ mealCounts[opt.id] }}</n-text>
            <n-progress
              type="line"
              :percentage="confirmedGuests.length ? Math.round((mealCounts[opt.id] / confirmedGuests.length) * 100) : 0"
            />
          </div>
          <div>
            <n-text depth="3">No selection: {{ mealCounts['none'] }}</n-text>
          </div>
        </n-space>
      </n-card>

      <n-data-table
        :columns="columns"
        :data="guestStore.guests"
        :row-key="(r: Guest) => r.id"
        :pagination="{ pageSize: 20 }"
        striped
      />
    </n-space>
  </div>
</template>
