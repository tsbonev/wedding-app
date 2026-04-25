<script setup lang="ts">
import { computed } from 'vue'
import { NGrid, NGi, NStatistic, NCard, NProgress, NSpace, NText } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const guests = useGuestStore()
const seating = useSeatingStore()
const rooms = useRoomStore()
const config = useAppConfigStore()

const stats = computed(() => {
  const total = guests.guests.length
  const confirmed = guests.guests.filter((g) => g.rsvpStatus === 'confirmed').length
  const declined = guests.guests.filter((g) => g.rsvpStatus === 'declined').length
  const pending = total - confirmed - declined

  const totalSeats = seating.tables.reduce((s, t) => s + t.capacity, 0)
  const assignedSeats = seating.tables.reduce((s, t) => s + t.seats.filter((seat) => seat.guestId).length, 0)

  const totalRoomCapacity = rooms.rooms.reduce((s, r) => s + r.capacity, 0)
  const occupiedRooms = rooms.rooms.reduce((s, r) => s + r.guestIds.length, 0)

  return { total, confirmed, declined, pending, totalSeats, assignedSeats, totalRoomCapacity, occupiedRooms }
})

const daysUntil = computed(() => {
  const d = config.weddingDate
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
})
</script>

<template>
  <div>
    <n-space vertical :size="24">
      <div>
        <h1 style="margin: 0 0 4px;">{{ config.coupleName || 'My Wedding' }}</h1>
        <n-text v-if="daysUntil !== null" depth="3">
          {{ daysUntil > 0 ? `${daysUntil} days to go` : daysUntil === 0 ? 'Today is the big day! 🎉' : 'Wedding passed' }}
        </n-text>
      </div>

      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <n-gi span="2 m:1">
          <n-card title="Guests">
            <n-grid :cols="3" :x-gap="16">
              <n-gi><n-statistic label="Total" :value="stats.total" /></n-gi>
              <n-gi><n-statistic label="Confirmed" :value="stats.confirmed" /></n-gi>
              <n-gi><n-statistic label="Pending" :value="stats.pending" /></n-gi>
            </n-grid>
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card title="Seating">
            <n-statistic label="Assigned" :value="`${stats.assignedSeats} / ${stats.totalSeats}`" />
            <n-progress
              v-if="stats.totalSeats > 0"
              type="line"
              :percentage="Math.round((stats.assignedSeats / stats.totalSeats) * 100)"
              style="margin-top: 12px"
            />
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card title="Hotel Rooms">
            <n-statistic label="Guests Accommodated" :value="`${stats.occupiedRooms} / ${stats.totalRoomCapacity}`" />
            <n-progress
              v-if="stats.totalRoomCapacity > 0"
              type="line"
              :percentage="Math.round((stats.occupiedRooms / stats.totalRoomCapacity) * 100)"
              style="margin-top: 12px"
            />
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card title="RSVP Breakdown">
            <n-space vertical>
              <div v-for="(count, label) in { Confirmed: stats.confirmed, Declined: stats.declined, Pending: stats.pending }" :key="label">
                <n-text depth="3" style="font-size:12px">{{ label }}: {{ count }}</n-text>
                <n-progress
                  type="line"
                  :percentage="stats.total ? Math.round((count / stats.total) * 100) : 0"
                  :color="label === 'Confirmed' ? '#18a058' : label === 'Declined' ? '#d03050' : '#f0a020'"
                />
              </div>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </div>
</template>
