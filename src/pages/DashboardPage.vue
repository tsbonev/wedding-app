<script setup lang="ts">
import { computed } from 'vue'
import { NGrid, NGi, NStatistic, NCard, NProgress, NSpace, NText } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'

const guests = useGuestStore()
const seating = useSeatingStore()
const rooms = useRoomStore()
const config = useAppConfigStore()
const i18n = useI18nStore()

const stats = computed(() => {
  const total = guests.guests.length
  const confirmed = guests.guests.filter((g) => g.rsvpStatus === 'confirmed').length
  const declined = guests.guests.filter((g) => g.rsvpStatus === 'declined').length
  const pending = total - confirmed - declined
  const needsSeat = confirmed + pending

  const totalSeats = seating.tables.reduce((s, t) => s + t.capacity, 0)
  const assignedSeats = seating.tables.reduce((s, t) => s + t.seats.filter((seat) => seat.guestId).length, 0)

  const totalRoomCapacity = rooms.rooms.reduce((s, r) => s + r.capacity, 0)
  const occupiedRoomSpots = rooms.rooms.reduce((s, r) => s + r.guestIds.length, 0)
  const totalRooms = rooms.rooms.length
  const emptyRooms = rooms.rooms.filter(r => r.guestIds.length === 0).length

  return { total, confirmed, declined, pending, needsSeat, totalSeats, assignedSeats, totalRoomCapacity, occupiedRoomSpots, totalRooms, emptyRooms }
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
        <h1 style="margin: 0 0 4px;">{{ config.coupleName || i18n.t('my_wedding') }}</h1>
        <n-text v-if="daysUntil !== null" depth="3">
          {{ daysUntil > 0 ? `${daysUntil} ${i18n.t('days_to_go')}` : daysUntil === 0 ? i18n.t('today_big_day') : i18n.t('wedding_passed') }}
        </n-text>
      </div>

      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <n-gi span="2 m:1">
          <n-card :title="i18n.t('guests')">
            <n-grid :cols="3" :x-gap="16">
              <n-gi><n-statistic :label="i18n.t('total')" :value="stats.total" /></n-gi>
              <n-gi><n-statistic :label="i18n.t('confirmed')" :value="stats.confirmed" /></n-gi>
              <n-gi><n-statistic :label="i18n.t('pending')" :value="stats.pending" /></n-gi>
            </n-grid>
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card :title="i18n.t('seating')">
            <n-space justify="space-between" align="center">
              <n-statistic :label="i18n.t('assigned')" :value="`${stats.assignedSeats} / ${stats.needsSeat}`" />
              <n-statistic :label="i18n.t('total_seats')" :value="stats.totalSeats" />
            </n-space>
            <n-progress
              v-if="stats.needsSeat > 0"
              type="line"
              :percentage="Math.min(100, Math.round((stats.assignedSeats / stats.needsSeat) * 100))"
              style="margin-top: 12px"
            />
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card :title="i18n.t('hotel_rooms')">
            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-statistic :label="i18n.t('total_rooms')" :value="stats.totalRooms" />
              </n-gi>
              <n-gi>
                <n-statistic :label="i18n.t('empty_rooms')" :value="stats.emptyRooms" />
              </n-gi>
            </n-grid>
            <n-statistic :label="i18n.t('guests_accommodated')" :value="`${stats.occupiedRoomSpots} / ${stats.totalRoomCapacity}`" style="margin-top: 12px" />
            <n-progress
              v-if="stats.totalRoomCapacity > 0"
              type="line"
              :percentage="Math.round((stats.occupiedRoomSpots / stats.totalRoomCapacity) * 100)"
              style="margin-top: 12px"
            />
          </n-card>
        </n-gi>
        <n-gi span="2 m:1">
          <n-card :title="i18n.t('rsvp_breakdown')">
            <n-space vertical>
              <div v-for="(count, key) in { confirmed: stats.confirmed, declined: stats.declined, pending: stats.pending }" :key="key">
                <n-text depth="3" style="font-size:12px">{{ i18n.t(key) }}: {{ count }}</n-text>
                <n-progress
                  type="line"
                  :percentage="stats.total ? Math.round((count / stats.total) * 100) : 0"
                  :color="key === 'confirmed' ? '#18a058' : key === 'declined' ? '#d03050' : '#f0a020'"
                />
              </div>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </div>
</template>
