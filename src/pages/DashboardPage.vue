<script setup lang="ts">
import { computed } from 'vue'
import { NGrid, NGi, NStatistic, NCard, NProgress, NSpace, NText, NTooltip } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { BudgetExpense } from '@/types'

const guests = useGuestStore()
const seating = useSeatingStore()
const rooms = useRoomStore()
const groupStore = useGroupStore()
const menuStore = useMenuStore()
const budgetStore = useBudgetStore()
const config = useAppConfigStore()
const i18n = useI18nStore()

const ROOM_BREAKDOWN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']
const MEAL_BREAKDOWN_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6']
const EXPENSE_BREAKDOWN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#14b8a6']

function normalizeBreakdownPercentages<T extends { count: number; percentage: number }>(items: T[]): T[] {
  if (items.length === 0) return items
  const sum = items.reduce((s, it) => s + it.percentage, 0)
  if (sum !== 100) items[0].percentage += (100 - sum)
  return items
}

const stats = computed(() => {
  const activeGuests = guests.guests.filter(g => g.rsvpStatus !== 'declined')
  const total = activeGuests.length
  const confirmed = activeGuests.filter((g) => g.rsvpStatus === 'confirmed').length
  const pending = total - confirmed
  
  const totalSeats = seating.tables.reduce((s, t) => s + t.capacity, 0)
  
  // A guest is "seated" if assigned directly or as adjoining child to a seated parent
  const seatedGuests = activeGuests.filter(g => guests.isGuestAssignedToTable(g))
  // Guests in formal seats only (kept for seat occupancy progress)
  const seatedInSeat = activeGuests.filter(g => g.tableId !== null)
  const assignedSeats = seatedInSeat.length
  const seatedMealCount = seatedGuests.filter(g => g.mealChoiceId !== null).length
  const seatedMenuPrice = seatedGuests.reduce((sum, guest) => {
    if (!guest.mealChoiceId) return sum
    return sum + (menuStore.menuOptions.find((m) => m.id === guest.mealChoiceId)?.price ?? 0)
  }, 0)

  // Children in adjoining seats (not taking up a formal seat)
  const adjoiningChildren = activeGuests.filter(g => {
    if (g.isChildrenSeatAdjoining && g.parentId) {
      const parent = guests.getById(g.parentId)
      return parent && parent.tableId !== null
    }
    return false
  })
  const adjoiningChildrenCount = adjoiningChildren.length

  const totalRoomCapacity = rooms.rooms.reduce((s, r) => s + r.capacity, 0)
  const occupiedRoomSpots = rooms.rooms.reduce((s, r) => {
    const activeInRoom = r.guestIds.filter(id => {
      const g = guests.getById(id)
      return g && g.rsvpStatus !== 'declined'
    })
    return s + activeInRoom.length
  }, 0)
  const totalRooms = rooms.rooms.length
  const emptyRooms = rooms.rooms.filter(r => {
    const activeInRoom = r.guestIds.filter(id => {
      const g = guests.getById(id)
      return g && g.rsvpStatus !== 'declined'
    })
    return activeInRoom.length === 0
  }).length
  const remainingRoomCapacity = totalRoomCapacity - occupiedRoomSpots
  const assignedRooms = rooms.rooms.filter(r => {
    const activeInRoom = r.guestIds.filter(id => {
      const g = guests.getById(id)
      return g && g.rsvpStatus !== 'declined'
    })
    return activeInRoom.length > 0
  })

  const roomTypeSummary = Object.entries(
    assignedRooms.reduce((acc, room) => {
      const key = room.type || 'other'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([type, count]) => `${i18n.t(type.toLowerCase()) === type.toLowerCase() ? type : i18n.t(type.toLowerCase())}: ${count}`)
  const assignedRoomTypeBreakdown = normalizeBreakdownPercentages(
    Object.entries(
      assignedRooms.reduce((acc, room) => {
        const key = room.type || 'other'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .map(([type, count], idx) => {
        const typeKey = type.toLowerCase()
        const translated = i18n.t(typeKey)
        const label = translated === typeKey ? type : translated
        return {
          id: type,
          name: label,
          color: ROOM_BREAKDOWN_COLORS[idx % ROOM_BREAKDOWN_COLORS.length],
          count,
          percentage: assignedRooms.length > 0 ? (count / assignedRooms.length) * 100 : 0
        }
      })
      .sort((a, b) => b.count - a.count)
  )

  const mealCountMap = seatedGuests.reduce((acc, guest) => {
    if (!guest.mealChoiceId) return acc
    acc[guest.mealChoiceId] = (acc[guest.mealChoiceId] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mealBreakdown = normalizeBreakdownPercentages(
    menuStore.menuOptions
      .map((meal, idx) => ({
        id: meal.id,
        name: meal.label,
        emoji: meal.emoji,
        color: MEAL_BREAKDOWN_COLORS[idx % MEAL_BREAKDOWN_COLORS.length],
        count: mealCountMap[meal.id] ?? 0,
        percentage: seatedMealCount > 0 ? ((mealCountMap[meal.id] ?? 0) / seatedMealCount) * 100 : 0
      }))
      .filter((meal) => meal.count > 0)
      .sort((a, b) => b.count - a.count)
  )
  const totalHotelPrice = rooms.roomPricingMode === 'average'
    ? rooms.averageRoomPrice * totalRooms
    : rooms.rooms.reduce((sum, room) => sum + (room.price ?? 0), 0)

  const declined = guests.guests.filter((g) => g.rsvpStatus === 'declined').length

  const groupBreakdown = groupStore.groups.map(group => {
    const count = activeGuests.filter(g => g.groupId === group.id).length
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }
  })

  // Add "Other" group for guests without a group
  const otherCount = activeGuests.filter(g => !g.groupId).length
  if (otherCount > 0) {
    groupBreakdown.push({
      id: 'other',
      name: i18n.t('other'),
      color: '#94a3b8',
      count: otherCount,
      percentage: total > 0 ? (otherCount / total) * 100 : 0
    })
  }

  // Sort by count descending
  groupBreakdown.sort((a, b) => b.count - a.count)

  // Ensure percentages sum to exactly 100 if there are guests
  if (total > 0 && groupBreakdown.length > 0) {
    const sum = groupBreakdown.reduce((s, g) => s + g.percentage, 0)
    if (sum !== 100) {
      // Add the difference to the largest group
      // Since it's already sorted, it's the first one
      groupBreakdown[0].percentage += (100 - sum)
    }
  }

  return { 
    total, confirmed, declined, pending, 
    totalSeats, assignedSeats, adjoiningChildrenCount, seatedMealCount, seatedMenuPrice, mealBreakdown,
    totalRoomCapacity, occupiedRoomSpots, totalRooms, emptyRooms, remainingRoomCapacity, roomTypeSummary, assignedRoomTypeBreakdown, totalHotelPrice,
    groupBreakdown
  }
})

function getBudgetPlannedAmount(expense: BudgetExpense): number {
  const activeGuests = guests.guests.filter((g) => g.rsvpStatus !== 'declined')
  const seatedGuests = activeGuests.filter((g) => guests.isGuestAssignedToTable(g))

  if (expense.type === 'plates') {
    if ((expense.platePricingMode ?? 'adult-child') === 'meal-prices') {
      const scopedGuests = expense.linkToSeatedGuests === false ? activeGuests : seatedGuests
      return scopedGuests.reduce((sum, guest) => {
        if (!guest.mealChoiceId) return sum
        return sum + (menuStore.menuOptions.find((m) => m.id === guest.mealChoiceId)?.price ?? 0)
      }, 0)
    }
    const seatedCounts = {
      adults: seatedGuests.filter((g) => !g.isChild).length,
      children: seatedGuests.filter((g) => g.isChild).length,
    }
    const counts = expense.linkToSeatedGuests === false
      ? { adults: Math.max(0, Math.trunc(expense.manualAdultCount ?? 0)), children: Math.max(0, Math.trunc(expense.manualChildCount ?? 0)) }
      : seatedCounts
    return (expense.adultPlatePrice ?? 0) * counts.adults + (expense.childPlatePrice ?? 0) * counts.children
  }

  if (expense.type === 'rooms') {
    const scopedRooms = (expense.roomsOccupancyMode ?? 'occupied') === 'all'
      ? rooms.rooms
      : rooms.rooms.filter((room) => room.guestIds.some((gid) => {
        const g = guests.getById(gid)
        return !!g && g.rsvpStatus !== 'declined'
      }))
    if ((expense.roomPricingMode ?? rooms.roomPricingMode) === 'average') {
      const avg = expense.averageRoomPriceOverride && expense.averageRoomPriceOverride > 0
        ? expense.averageRoomPriceOverride
        : rooms.averageRoomPrice
      return avg * scopedRooms.length
    }
    return scopedRooms.reduce((sum, room) => sum + (room.price ?? 0), 0)
  }

  return expense.plannedAmount ?? 0
}

const budgetTotals = computed(() => {
  const planned = budgetStore.expenses.reduce((sum, expense) => sum + getBudgetPlannedAmount(expense), 0)
  const paid = budgetStore.expenses.reduce((sum, expense) => sum + (expense.paidAmount ?? 0), 0)
  const totalExpenses = budgetStore.expenses.reduce((sum, expense) => {
    const plannedAmount = getBudgetPlannedAmount(expense)
    return sum + (expense.finalAmount ?? plannedAmount)
  }, 0)

  return {
    planned,
    paid,
    remaining: planned - paid,
    totalExpenses,
  }
})

const budgetBreakdown = computed(() => {
  const rows = budgetStore.expenses
    .map((expense, idx) => ({
      id: expense.id,
      name: expense.name,
      emoji: expense.iconEmoji,
      amount: getBudgetPlannedAmount(expense),
      color: EXPENSE_BREAKDOWN_COLORS[idx % EXPENSE_BREAKDOWN_COLORS.length],
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  if (total <= 0) return []

  const withPercentages = rows.map((row) => ({ ...row, percentage: (row.amount / total) * 100 }))
  const sum = withPercentages.reduce((acc, row) => acc + row.percentage, 0)
  if (withPercentages.length > 0 && sum !== 100) withPercentages[0].percentage += 100 - sum
  return withPercentages
})

function formatAmount(value: number) {
  return value.toLocaleString(i18n.locale === 'bg' ? 'bg-BG' : 'en-US', {
    style: 'currency',
    currency: config.currency === 'USD' ? 'USD' : 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const daysUntil = computed(() => {
  const d = config.weddingDate
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
})
</script>
<style scoped>
.group-bar-segment {
  height: 100%;
  transition: transform 0.2s ease;
  cursor: pointer;
}
.group-bar-segment:hover {
  transform: scaleY(1.5);
  z-index: 1;
}
.dashboard-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.dashboard-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (max-width: 900px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div>
    <n-space vertical :size="24">
      <div>
        <h1 style="margin: 0 0 4px;">{{ config.coupleName || i18n.t('my_wedding') }}</h1>
        <n-text v-if="daysUntil !== null" depth="3">
          {{ daysUntil > 0 ? `${daysUntil} ${i18n.t('days_to_go')}` : daysUntil === 0 ? i18n.t('today_big_day') : i18n.t('wedding_passed') }}
        </n-text>
      </div>

      <div class="dashboard-columns">
        <div class="dashboard-column">
          <n-card :title="i18n.t('guests')">
            <n-space vertical :size="16">
              <n-statistic :label="i18n.t('total')" :value="stats.total" />
              
              <div v-if="stats.groupBreakdown.length > 0">
                <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">{{ i18n.t('group_breakdown') }}</n-text>
                <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; align-items: stretch; isolate: isolate;">
                  <n-tooltip 
                    v-for="group in stats.groupBreakdown" 
                    :key="group.id"
                    trigger="hover"
                    placement="top"
                  >
                    <template #trigger>
                      <div 
                        v-show="group.count > 0"
                        class="group-bar-segment"
                        :style="{ 
                          flex: `0 0 ${group.percentage}%`, 
                          backgroundColor: group.color
                        }"
                      />
                    </template>
                    {{ group.name }}: {{ group.count }}
                  </n-tooltip>
                </div>
                <n-grid :cols="2" :x-gap="12" :y-gap="8">
                  <n-gi v-for="group in stats.groupBreakdown" :key="group.id">
                    <n-space :size="8" align="center" inline>
                      <div :style="{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: group.color }" />
                      <n-text depth="2" style="font-size: 13px;">{{ group.name }}: {{ group.count }}</n-text>
                    </n-space>
                  </n-gi>
                </n-grid>
              </div>
            </n-space>
          </n-card>

          <n-card :title="i18n.t('hotel_rooms')">
            <n-grid :cols="3" :x-gap="16">
              <n-gi>
                <n-statistic :label="i18n.t('total_rooms')" :value="stats.totalRooms" />
              </n-gi>
              <n-gi>
                <n-statistic :label="i18n.t('max_capacity')" :value="stats.totalRoomCapacity" />
              </n-gi>
              <n-gi>
                <n-statistic :label="i18n.t('remaining_capacity')" :value="stats.remainingRoomCapacity" />
              </n-gi>
            </n-grid>
            <n-statistic :label="i18n.t('guests_accommodated')" :value="stats.occupiedRoomSpots" style="margin-top: 12px" />
            <n-progress
              v-if="stats.totalRoomCapacity > 0"
              type="line"
              :percentage="Math.round((stats.occupiedRoomSpots / stats.totalRoomCapacity) * 100)"
              style="margin-top: 12px"
            />
            <div v-if="stats.assignedRoomTypeBreakdown.length > 0" style="margin-top: 10px;">
              <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">{{ i18n.t('room_type_breakdown') }}</n-text>
              <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; align-items: stretch; isolate: isolate;">
                <n-tooltip
                  v-for="roomType in stats.assignedRoomTypeBreakdown"
                  :key="roomType.id"
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <div
                      class="group-bar-segment"
                      :style="{
                        flex: `0 0 ${roomType.percentage}%`,
                        backgroundColor: roomType.color
                      }"
                    />
                  </template>
                  {{ roomType.name }}: {{ roomType.count }}
                </n-tooltip>
              </div>
            </div>
            <n-space vertical :size="6" style="margin-top: 10px;">
              <n-text depth="3">{{ i18n.t('room_types') }}: {{ stats.roomTypeSummary.length ? stats.roomTypeSummary.join(', ') : '—' }}</n-text>
              <n-text v-if="config.showBudgetOnDashboard" depth="3">{{ i18n.t('hotel_price') }}: {{ formatAmount(stats.totalHotelPrice) }}</n-text>
            </n-space>
          </n-card>
        </div>

        <div class="dashboard-column">
          <n-card v-if="config.showBudgetOnDashboard" :title="i18n.t('budget_summary')">
            <n-grid :cols="2" :x-gap="16" :y-gap="10">
              <n-gi><n-statistic :label="i18n.t('planned_amount')" :value="formatAmount(budgetTotals.planned)" /></n-gi>
              <n-gi><n-statistic :label="i18n.t('paid_amount')" :value="formatAmount(budgetTotals.paid)" /></n-gi>
              <n-gi><n-statistic :label="i18n.t('remaining_to_pay')" :value="formatAmount(budgetTotals.remaining)" /></n-gi>
              <n-gi><n-statistic :label="i18n.t('total_expenses')" :value="formatAmount(budgetTotals.totalExpenses)" /></n-gi>
            </n-grid>
            <div v-if="budgetBreakdown.length > 0" style="margin-top: 10px;">
              <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">{{ i18n.t('expense_breakdown') }}</n-text>
              <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; align-items: stretch; isolate: isolate;">
                <n-tooltip
                  v-for="item in budgetBreakdown"
                  :key="`budget-segment-${item.id}`"
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <div
                      class="group-bar-segment"
                      :style="{
                        flex: `0 0 ${item.percentage}%`,
                        backgroundColor: item.color
                      }"
                    />
                  </template>
                  {{ item.emoji ? `${item.emoji} ` : '' }}{{ item.name }}: {{ formatAmount(item.amount) }}
                </n-tooltip>
              </div>
            </div>
          </n-card>

          <n-card :title="i18n.t('seating')">
            <n-space justify="space-between" align="center">
              <div>
                <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 4px;">{{ i18n.t('assigned') }}</n-text>
                <n-space :size="4" align="center">
                  <span style="font-size: 24px;">{{ stats.assignedSeats }}</span>
                  <n-tooltip v-if="stats.adjoiningChildrenCount > 0" trigger="hover">
                    <template #trigger>
                      <n-text depth="3" style="font-size: 18px; cursor: help;">({{ stats.adjoiningChildrenCount }})</n-text>
                    </template>
                    {{ i18n.t('child_adjoining_tooltip') }}
                  </n-tooltip>
                </n-space>
              </div>
              <n-statistic :label="i18n.t('total_seats')" :value="stats.totalSeats" />
            </n-space>
            <n-progress
              v-if="stats.totalSeats > 0"
              type="line"
              :percentage="Math.min(100, Math.round((stats.assignedSeats / stats.totalSeats) * 100))"
              style="margin-top: 12px"
            />
            <n-space justify="space-between" style="margin-top: 10px;">
              <n-text depth="3">{{ i18n.t('meal_count') }}: {{ stats.seatedMealCount }}</n-text>
              <n-text v-if="config.showBudgetOnDashboard" depth="3">{{ i18n.t('menu_price') }}: {{ formatAmount(stats.seatedMenuPrice) }}</n-text>
            </n-space>
            <div v-if="stats.mealBreakdown.length > 0" style="margin-top: 10px;">
              <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">{{ i18n.t('meal_type_breakdown') }}</n-text>
              <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; align-items: stretch; isolate: isolate;">
                <n-tooltip
                  v-for="meal in stats.mealBreakdown"
                  :key="meal.id"
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <div
                      class="group-bar-segment"
                      :style="{
                        flex: `0 0 ${meal.percentage}%`,
                        backgroundColor: meal.color
                      }"
                    />
                  </template>
                  {{ meal.emoji }} {{ meal.name }}: {{ meal.count }}
                </n-tooltip>
              </div>
              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-gi v-for="meal in stats.mealBreakdown" :key="`summary-${meal.id}`">
                  <n-text depth="2" style="font-size: 13px;">{{ meal.emoji }} {{ meal.name }}: {{ meal.count }}</n-text>
                </n-gi>
              </n-grid>
            </div>
          </n-card>

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
        </div>
      </div>
    </n-space>
  </div>
</template>
