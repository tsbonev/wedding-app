<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NCard, NCheckbox, NDropdown, NGrid, NGi, NIcon, NInput, NInputNumber, NPopover, NProgress, NSelect, NSpace, NStatistic, NText, NTooltip } from 'naive-ui'
import { ArrowDownIcon } from 'naive-ui/es/_internal/icons'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import EmojiPicker from 'vue3-emoji-picker'
// @ts-ignore
import 'vue3-emoji-picker/css'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { BudgetExpense, Guest, Room } from '@/types'
import EmptyState from '@/components/shared/EmptyState.vue'

const budgetStore = useBudgetStore()
const guestStore = useGuestStore()
const menuStore = useMenuStore()
const roomStore = useRoomStore()
const configStore = useAppConfigStore()
const i18n = useI18nStore()

const newExpense = ref<Omit<BudgetExpense, 'id'>>({
  iconEmoji: null,
  name: '',
  type: 'manual',
  plannedAmount: 0,
  paidAmount: 0,
  finalAmount: null,
  adultPlatePrice: 0,
  childPlatePrice: 0,
  platePricingMode: 'adult-child',
  linkToSeatedGuests: true,
  manualAdultCount: 0,
  manualChildCount: 0,
  roomPricingMode: roomStore.roomPricingMode,
  roomsOccupancyMode: 'occupied',
  averageRoomPriceOverride: 0,
})

const editingId = ref<string | null>(null)
const draftExpense = ref<Omit<BudgetExpense, 'id'> | null>(null)
const EXPENSE_BREAKDOWN_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#14b8a6']
type BudgetSortKey = 'icon' | 'name' | 'type' | 'planned' | 'paid' | 'final' | 'remaining'
const sortKey = ref<BudgetSortKey>('planned')
const sortDir = ref<'asc' | 'desc'>('desc')

function onNewEmojiSelect(emoji: { i: string }) {
  newExpense.value.iconEmoji = emoji.i
}

function onDraftEmojiSelect(emoji: { i: string }) {
  if (!draftExpense.value) return
  draftExpense.value.iconEmoji = emoji.i
}

function normalizeAmount(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  const rounded = Math.round(value * 100) / 100
  return Math.max(0, rounded)
}

function normalizeCount(value: number | null | undefined): number {
  return Math.max(0, Math.trunc(value ?? 0))
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

function normalizeExpensePayload(payload: Omit<BudgetExpense, 'id'>): Omit<BudgetExpense, 'id'> {
  return {
    iconEmoji: payload.iconEmoji?.trim() || null,
    name: payload.name.trim(),
    type: payload.type ?? 'manual',
    plannedAmount: normalizeAmount(payload.plannedAmount),
    paidAmount: normalizeAmount(payload.paidAmount),
    finalAmount: payload.finalAmount === null ? null : normalizeAmount(payload.finalAmount),
    adultPlatePrice: normalizeAmount(payload.adultPlatePrice),
    childPlatePrice: normalizeAmount(payload.childPlatePrice),
    platePricingMode: payload.platePricingMode === 'meal-prices' ? 'meal-prices' : 'adult-child',
    linkToSeatedGuests: payload.linkToSeatedGuests ?? true,
    manualAdultCount: normalizeCount(payload.manualAdultCount),
    manualChildCount: normalizeCount(payload.manualChildCount),
    roomPricingMode: payload.roomPricingMode === 'average' ? 'average' : 'per-room',
    roomsOccupancyMode: payload.roomsOccupancyMode === 'all' ? 'all' : 'occupied',
    averageRoomPriceOverride: normalizeAmount(payload.averageRoomPriceOverride),
  }
}

function resetNewExpense() {
  newExpense.value = {
    iconEmoji: null,
    name: '',
    type: 'manual',
    plannedAmount: 0,
    paidAmount: 0,
    finalAmount: null,
    adultPlatePrice: 0,
    childPlatePrice: 0,
    platePricingMode: 'adult-child',
    linkToSeatedGuests: true,
    manualAdultCount: 0,
    manualChildCount: 0,
    roomPricingMode: roomStore.roomPricingMode,
    roomsOccupancyMode: 'occupied',
    averageRoomPriceOverride: 0,
  }
}

function addExpense() {
  const payload = normalizeExpensePayload(newExpense.value)
  if (!payload.name) return
  budgetStore.addExpense(payload)
  resetNewExpense()
}

function startEdit(expense: BudgetExpense) {
  editingId.value = expense.id
  draftExpense.value = normalizeExpensePayload({
    iconEmoji: expense.iconEmoji ?? null,
    name: expense.name,
    type: expense.type ?? 'manual',
    plannedAmount: expense.plannedAmount,
    paidAmount: expense.paidAmount,
    finalAmount: expense.finalAmount,
    adultPlatePrice: expense.adultPlatePrice ?? 0,
    childPlatePrice: expense.childPlatePrice ?? 0,
    platePricingMode: expense.platePricingMode ?? 'adult-child',
    linkToSeatedGuests: expense.linkToSeatedGuests ?? true,
    manualAdultCount: expense.manualAdultCount ?? 0,
    manualChildCount: expense.manualChildCount ?? 0,
    roomPricingMode: expense.roomPricingMode ?? roomStore.roomPricingMode,
    roomsOccupancyMode: expense.roomsOccupancyMode ?? 'occupied',
    averageRoomPriceOverride: expense.averageRoomPriceOverride ?? 0,
  })
}

function cancelEdit() {
  editingId.value = null
  draftExpense.value = null
}

function confirmEdit() {
  if (!editingId.value || !draftExpense.value) return
  const payload = normalizeExpensePayload(draftExpense.value)
  if (!payload.name) return
  budgetStore.updateExpense(editingId.value, payload)
  cancelEdit()
}

function setDraftPaidToPlanned() {
  if (!draftExpense.value) return
  const draftAsExpense: BudgetExpense = { id: '__draft__', ...draftExpense.value }
  draftExpense.value.paidAmount = normalizeAmount(getEffectivePlannedAmount(draftAsExpense))
}

function removeExpense(id: string) {
  if (editingId.value === id) cancelEdit()
  budgetStore.removeExpense(id)
}

const expenseTypeOptions = computed(() => ([
  { label: i18n.t('manual_expense'), value: 'manual' },
  { label: i18n.t('plates_expense'), value: 'plates' },
  { label: i18n.t('rooms_expense'), value: 'rooms' },
]))

const platePricingModeOptions = computed(() => ([
  { label: i18n.t('adult_child_pricing'), value: 'adult-child' },
  { label: i18n.t('meal_price_pricing'), value: 'meal-prices' },
]))

const roomPricingModeOptions = computed(() => ([
  { label: i18n.t('per_room'), value: 'per-room' },
  { label: i18n.t('average'), value: 'average' },
]))

const roomsOccupancyModeOptions = computed(() => ([
  { label: i18n.t('occupied_rooms_only'), value: 'occupied' },
  { label: i18n.t('all_rooms'), value: 'all' },
]))

const activeGuests = computed(() => guestStore.guests.filter((g) => g.rsvpStatus !== 'declined'))
const seatedGuests = computed(() => activeGuests.value.filter((g) => guestStore.isGuestAssignedToTable(g)))
const seatedGuestCounts = computed(() => ({
  adults: seatedGuests.value.filter((g) => !g.isChild).length,
  children: seatedGuests.value.filter((g) => g.isChild).length,
}))

function getGuestsForMealPricing(expense: BudgetExpense): Guest[] {
  return expense.linkToSeatedGuests === false ? activeGuests.value : seatedGuests.value
}

function getPlateCounts(expense: BudgetExpense) {
  if (expense.linkToSeatedGuests ?? true) return seatedGuestCounts.value
  return {
    adults: normalizeCount(expense.manualAdultCount),
    children: normalizeCount(expense.manualChildCount),
  }
}

function getRoomsForBudget(expense: BudgetExpense): Room[] {
  if ((expense.roomsOccupancyMode ?? 'occupied') === 'all') return roomStore.rooms
  return roomStore.rooms.filter((room) => room.guestIds.some((gid) => {
    const guest = guestStore.getById(gid)
    return !!guest && guest.rsvpStatus !== 'declined'
  }))
}

function getEffectivePlannedAmount(expense: BudgetExpense): number {
  if (expense.type === 'plates') {
    if ((expense.platePricingMode ?? 'adult-child') === 'meal-prices') {
      const guests = getGuestsForMealPricing(expense)
      return roundMoney(guests.reduce((sum, guest) => {
        if (!guest.mealChoiceId) return sum
        const option = menuStore.menuOptions.find((m) => m.id === guest.mealChoiceId)
        return sum + normalizeAmount(option?.price)
      }, 0))
    }
    const counts = getPlateCounts(expense)
    return roundMoney(normalizeAmount(expense.adultPlatePrice) * counts.adults + normalizeAmount(expense.childPlatePrice) * counts.children)
  }

  if (expense.type === 'rooms') {
    const rooms = getRoomsForBudget(expense)
    if ((expense.roomPricingMode ?? roomStore.roomPricingMode) === 'average') {
      const avg = normalizeAmount(expense.averageRoomPriceOverride) || normalizeAmount(roomStore.averageRoomPrice)
      return roundMoney(avg * rooms.length)
    }
    return roundMoney(rooms.reduce((sum, room) => sum + normalizeAmount(room.price), 0))
  }

  return normalizeAmount(expense.plannedAmount)
}

function getEffectiveFinalAmount(expense: BudgetExpense): number {
  return roundMoney(expense.finalAmount ?? getEffectivePlannedAmount(expense))
}

function getPaidPercent(expense: BudgetExpense): number {
  const planned = getEffectivePlannedAmount(expense)
  if (planned <= 0) return 0
  return Math.round((expense.paidAmount / planned) * 100)
}

function getTypeLabel(type: BudgetExpense['type']) {
  if (type === 'plates') return i18n.t('plates_expense')
  if (type === 'rooms') return i18n.t('rooms_expense')
  return i18n.t('manual_expense')
}

function getSortValue(expense: BudgetExpense, key: BudgetSortKey): number | string {
  const planned = getEffectivePlannedAmount(expense)
  if (key === 'icon') return (expense.iconEmoji ?? '').toLowerCase()
  if (key === 'name') return expense.name.toLowerCase()
  if (key === 'type') return getTypeLabel(expense.type).toLowerCase()
  if (key === 'planned') return planned
  if (key === 'paid') return normalizeAmount(expense.paidAmount)
  if (key === 'final') return getEffectiveFinalAmount(expense)
  return roundMoney(planned - normalizeAmount(expense.paidAmount))
}

function sortBy(key: BudgetSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDir.value = key === 'planned' ? 'desc' : 'asc'
}

function isSortAscending(key: BudgetSortKey): boolean {
  return sortKey.value === key && sortDir.value === 'asc'
}

function isSortDescending(key: BudgetSortKey): boolean {
  return sortKey.value === key && sortDir.value === 'desc'
}

const sortedExpenses = computed(() => (
  [...budgetStore.expenses].sort((a, b) => {
    const av = getSortValue(a, sortKey.value)
    const bv = getSortValue(b, sortKey.value)

    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    return sortDir.value === 'asc' ? cmp : -cmp
  })
))

const expenseBreakdown = computed(() => {
  const rows = [...budgetStore.expenses]
    .map((expense, idx) => ({
      id: expense.id,
      name: expense.name,
      emoji: expense.iconEmoji,
      amount: getEffectivePlannedAmount(expense),
      color: EXPENSE_BREAKDOWN_COLORS[idx % EXPENSE_BREAKDOWN_COLORS.length],
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  if (total <= 0) return []

  const withPercentages = rows.map((row) => ({
    ...row,
    percentage: (row.amount / total) * 100,
  }))

  const sum = withPercentages.reduce((acc, row) => acc + row.percentage, 0)
  if (withPercentages.length > 0 && sum !== 100) {
    withPercentages[0].percentage += 100 - sum
  }
  return withPercentages
})

const totals = computed(() => {
  const totalPlanned = roundMoney(budgetStore.expenses.reduce((sum, e) => sum + getEffectivePlannedAmount(e), 0))
  const totalPaid = roundMoney(budgetStore.expenses.reduce((sum, e) => sum + normalizeAmount(e.paidAmount), 0))
  const totalFinal = roundMoney(budgetStore.expenses.reduce((sum, e) => sum + getEffectiveFinalAmount(e), 0))
  const remaining = roundMoney(totalPlanned - totalPaid)
  return {
    totalPlanned,
    totalPaid,
    totalFinal,
    remaining,
    paidProgress: totalPlanned > 0 ? Math.round((totalPaid / totalPlanned) * 100) : 0,
  }
})

const numberLocale = computed(() => (i18n.locale === 'bg' ? 'bg-BG' : 'en-US'))
const expenseActionOptions = computed(() => ([
  { label: i18n.t('edit'), key: 'edit' },
  { label: i18n.t('delete'), key: 'delete' },
]))

function formatAmount(value: number) {
  return value.toLocaleString(numberLocale.value, {
    style: 'currency',
    currency: configStore.currency === 'USD' ? 'USD' : 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function handleExpenseAction(expense: BudgetExpense, key: string | number) {
  if (key === 'edit') {
    startEdit(expense)
    return
  }
  if (key === 'delete') {
    if (window.confirm(i18n.t('are_you_sure'))) {
      removeExpense(expense.id)
    }
  }
}

function renderExpenseActionLabel(option: any) {
  const isDelete = option.key === 'delete'
  const icon = isDelete ? Trash2 : Pencil
  const label = typeof option.label === 'string' ? option.label : ''
  return h(
    'span',
    {
      class: ['expense-action-label', isDelete ? 'is-delete' : 'is-edit'],
      style: { display: 'inline-flex', alignItems: 'center' },
    },
    [
      h(
        NIcon,
        { size: 14, style: { marginRight: '8px', flexShrink: 0 } },
        { default: () => h(icon) },
      ),
      h('span', label),
    ],
  )
}
</script>

<template>
  <div class="budget-page">
    <n-space vertical :size="20">
      <div>
        <h2 style="margin: 0 0 6px;">{{ i18n.t('budget') }}</h2>
        <n-text depth="3">{{ i18n.t('budget_overview') }}</n-text>
      </div>

      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
        <n-gi span="2 m:1"><n-card :title="i18n.t('total_planned')"><n-statistic :value="formatAmount(totals.totalPlanned)" /></n-card></n-gi>
        <n-gi span="2 m:1"><n-card :title="i18n.t('total_paid')"><n-statistic :value="formatAmount(totals.totalPaid)" /><n-progress :percentage="Math.max(0, Math.min(100, totals.paidProgress))" style="margin-top:12px;" /></n-card></n-gi>
        <n-gi span="2 m:1"><n-card :title="i18n.t('total_final')"><n-statistic :value="formatAmount(totals.totalFinal)" /></n-card></n-gi>
        <n-gi span="2 m:1"><n-card :title="i18n.t('remaining_to_pay')"><n-statistic :value="formatAmount(totals.remaining)" /></n-card></n-gi>
      </n-grid>

      <n-card :title="i18n.t('add_expense_item')">
        <n-space align="end" wrap>
          <div class="field-wrap field-emoji">
            <span class="field-label">{{ i18n.t('icon') }}</span>
            <div class="emoji-input-row">
              <n-input v-model:value="newExpense.iconEmoji" :placeholder="i18n.t('placeholder_emoji')" maxlength="2" />
              <n-popover trigger="click" placement="bottom-start" :width="300" scrollable>
                <template #trigger>
                  <n-button ghost style="padding: 0 8px;">
                    {{ newExpense.iconEmoji || '🙂' }}
                  </n-button>
                </template>
                <EmojiPicker :native="true" @select="onNewEmojiSelect" />
              </n-popover>
            </div>
          </div>
          <div class="field-wrap field-name">
            <span class="field-label">{{ i18n.t('expense_name') }}</span>
            <n-input v-model:value="newExpense.name" :placeholder="i18n.t('expense_name_placeholder')" @keyup.enter="addExpense" />
          </div>
          <div class="field-wrap field-type">
            <span class="field-label">{{ i18n.t('expense_type') }}</span>
            <n-select v-model:value="newExpense.type" :options="expenseTypeOptions" />
          </div>
          <div v-if="newExpense.type === 'manual'" class="field-wrap field-amount">
            <span class="field-label">{{ i18n.t('planned_amount') }}</span>
            <n-input-number v-model:value="newExpense.plannedAmount" :min="0" :precision="2" style="width:100%" />
          </div>
          <n-button type="primary" :disabled="!newExpense.name.trim()" @click="addExpense">+ {{ i18n.t('add') }}</n-button>
        </n-space>
      </n-card>

      <EmptyState v-if="sortedExpenses.length === 0" icon="💸" :title="i18n.t('no_expenses_yet')" :description="i18n.t('add_budget_item_instruction')" />

      <n-card v-else :title="i18n.t('budget_entries')">
        <div v-if="expenseBreakdown.length > 0" style="margin-bottom: 16px;">
          <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">{{ i18n.t('expense_breakdown') }}</n-text>
          <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px; align-items: stretch; isolate: isolate;">
            <n-tooltip
              v-for="item in expenseBreakdown"
              :key="`expense-segment-${item.id}`"
              trigger="hover"
              placement="top"
            >
              <template #trigger>
                <div
                  class="expense-bar-segment"
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

        <div class="budget-table-wrap">
          <table class="budget-table">
            <thead>
              <tr>
                <th class="sortable" @click="sortBy('icon')"><span class="sort-head">{{ i18n.t('icon') }}<span :class="['n-data-table-sorter', isSortAscending('icon') && 'n-data-table-sorter--asc', isSortDescending('icon') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('name')"><span class="sort-head">{{ i18n.t('name') }}<span :class="['n-data-table-sorter', isSortAscending('name') && 'n-data-table-sorter--asc', isSortDescending('name') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('type')"><span class="sort-head">{{ i18n.t('expense_type') }}<span :class="['n-data-table-sorter', isSortAscending('type') && 'n-data-table-sorter--asc', isSortDescending('type') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('planned')"><span class="sort-head">{{ i18n.t('planned_amount') }}<span :class="['n-data-table-sorter', isSortAscending('planned') && 'n-data-table-sorter--asc', isSortDescending('planned') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('paid')"><span class="sort-head">{{ i18n.t('paid_amount') }}<span :class="['n-data-table-sorter', isSortAscending('paid') && 'n-data-table-sorter--asc', isSortDescending('paid') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('final')"><span class="sort-head">{{ i18n.t('final_amount') }}<span :class="['n-data-table-sorter', isSortAscending('final') && 'n-data-table-sorter--asc', isSortDescending('final') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th class="sortable" @click="sortBy('remaining')"><span class="sort-head">{{ i18n.t('remaining_to_pay') }}<span :class="['n-data-table-sorter', isSortAscending('remaining') && 'n-data-table-sorter--asc', isSortDescending('remaining') && 'n-data-table-sorter--desc']"><span class="n-base-icon"><ArrowDownIcon /></span></span></span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="expense in sortedExpenses" :key="expense.id">
                <tr>
                  <td class="emoji-cell">{{ expense.iconEmoji || '•' }}</td>
                  <td>{{ expense.name }}</td>
                  <td>{{ getTypeLabel(expense.type) }}</td>
                  <td>{{ formatAmount(getEffectivePlannedAmount(expense)) }}</td>
                  <td>{{ formatAmount(expense.paidAmount) }} ({{ getPaidPercent(expense) }}%)</td>
                  <td>{{ formatAmount(getEffectiveFinalAmount(expense)) }}</td>
                  <td>{{ formatAmount(getEffectivePlannedAmount(expense) - expense.paidAmount) }}</td>
                  <td>
                    <n-dropdown
                      trigger="click"
                      :options="expenseActionOptions"
                      :render-label="renderExpenseActionLabel"
                      @select="(key) => handleExpenseAction(expense, key)"
                    >
                      <n-button size="tiny" quaternary circle>
                        <template #icon>
                          <n-icon :component="MoreHorizontal" />
                        </template>
                      </n-button>
                    </n-dropdown>
                  </td>
                </tr>

                <tr v-if="editingId === expense.id && draftExpense">
                  <td colspan="8" class="editor-row">
                    <div class="edit-grid">
                      <div class="field-wrap field-emoji">
                        <span class="field-label">{{ i18n.t('icon') }}</span>
                        <div class="emoji-input-row">
                          <n-input v-model:value="draftExpense.iconEmoji" :placeholder="i18n.t('placeholder_emoji')" maxlength="2" />
                          <n-popover trigger="click" placement="bottom-start" :width="300" scrollable>
                            <template #trigger>
                              <n-button ghost style="padding: 0 8px;">
                                {{ draftExpense.iconEmoji || '🙂' }}
                              </n-button>
                            </template>
                            <EmojiPicker :native="true" @select="onDraftEmojiSelect" />
                          </n-popover>
                        </div>
                      </div>
                      <div class="field-wrap field-name"><span class="field-label">{{ i18n.t('expense_name') }}</span><n-input v-model:value="draftExpense.name" /></div>
                      <div class="field-wrap field-type"><span class="field-label">{{ i18n.t('expense_type') }}</span><n-select v-model:value="draftExpense.type" :options="expenseTypeOptions" /></div>

                      <template v-if="draftExpense.type === 'manual'">
                        <div class="field-wrap field-amount"><span class="field-label">{{ i18n.t('planned_amount') }}</span><n-input-number v-model:value="draftExpense.plannedAmount" :min="0" :precision="2" style="width:100%" /></div>
                      </template>

                      <template v-if="draftExpense.type === 'plates'">
                        <div class="field-wrap field-type"><span class="field-label">{{ i18n.t('plate_pricing_mode') }}</span><n-select v-model:value="draftExpense.platePricingMode" :options="platePricingModeOptions" /></div>
                        <div class="field-wrap field-wide"><n-checkbox v-model:checked="draftExpense.linkToSeatedGuests">{{ i18n.t('link_to_seated_guests') }}</n-checkbox></div>
                        <div v-if="draftExpense.platePricingMode === 'adult-child'" class="field-wrap field-amount"><span class="field-label">{{ i18n.t('plate_adult_price') }}</span><n-input-number v-model:value="draftExpense.adultPlatePrice" :min="0" :precision="2" style="width:100%" /></div>
                        <div v-if="draftExpense.platePricingMode === 'adult-child'" class="field-wrap field-amount"><span class="field-label">{{ i18n.t('plate_child_price') }}</span><n-input-number v-model:value="draftExpense.childPlatePrice" :min="0" :precision="2" style="width:100%" /></div>
                        <div v-if="draftExpense.platePricingMode === 'adult-child' && !draftExpense.linkToSeatedGuests" class="field-wrap field-count"><span class="field-label">{{ i18n.t('adult_count') }}</span><n-input-number v-model:value="draftExpense.manualAdultCount" :min="0" :precision="0" style="width:100%" /></div>
                        <div v-if="draftExpense.platePricingMode === 'adult-child' && !draftExpense.linkToSeatedGuests" class="field-wrap field-count"><span class="field-label">{{ i18n.t('child_count') }}</span><n-input-number v-model:value="draftExpense.manualChildCount" :min="0" :precision="0" style="width:100%" /></div>
                      </template>

                      <template v-if="draftExpense.type === 'rooms'">
                        <div class="field-wrap field-type"><span class="field-label">{{ i18n.t('room_pricing_mode') }}</span><n-select v-model:value="draftExpense.roomPricingMode" :options="roomPricingModeOptions" /></div>
                        <div class="field-wrap field-type"><span class="field-label">{{ i18n.t('rooms_count_mode') }}</span><n-select v-model:value="draftExpense.roomsOccupancyMode" :options="roomsOccupancyModeOptions" /></div>
                        <div v-if="draftExpense.roomPricingMode === 'average'" class="field-wrap field-amount"><span class="field-label">{{ i18n.t('average_room_price_override') }}</span><n-input-number v-model:value="draftExpense.averageRoomPriceOverride" :min="0" :precision="2" style="width:100%" /></div>
                      </template>

                      <div class="field-wrap field-amount">
                        <span class="field-label">{{ i18n.t('paid_amount') }}</span>
                        <div class="paid-edit-row">
                          <n-input-number v-model:value="draftExpense.paidAmount" :min="0" :precision="2" style="width:100%" />
                          <n-button size="small" @click="setDraftPaidToPlanned">{{ i18n.t('pay') }}</n-button>
                        </div>
                      </div>
                      <div class="field-wrap field-amount"><span class="field-label">{{ i18n.t('final_amount') }}</span><n-input-number v-model:value="draftExpense.finalAmount" :min="0" :precision="2" clearable style="width:100%" /></div>
                    </div>
                    <n-space justify="end" style="margin-top: 12px;">
                      <n-button @click="cancelEdit">{{ i18n.t('cancel') }}</n-button>
                      <n-button type="primary" @click="confirmEdit">{{ i18n.t('confirm') }}</n-button>
                    </n-space>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </n-card>
    </n-space>
  </div>
</template>

<style scoped>
.budget-page { max-width: 1150px; margin: 0 auto; }
.field-wrap { display: flex; flex-direction: column; gap: 6px; }
.field-emoji { width: 100px; max-width: 100%; }
.field-name { width: 280px; max-width: 100%; }
.field-type { width: 190px; max-width: 100%; }
.field-amount { width: 180px; max-width: 100%; }
.field-wide { min-width: 260px; max-width: 100%; }
.field-count { width: 120px; max-width: 100%; }
.field-label { font-size: 12px; color: var(--text-muted); }
.emoji-input-row { display: flex; align-items: center; gap: 6px; }
.paid-edit-row { display: flex; align-items: center; gap: 8px; }
.expense-bar-segment { transition: transform 0.2s ease; cursor: pointer; }
.expense-bar-segment:hover { transform: scaleY(1.5); z-index: 1; }
.budget-table-wrap { overflow-x: auto; }
.budget-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.budget-table th, .budget-table td { border-bottom: 1px solid var(--border-soft); padding: 10px 8px; vertical-align: middle; }
.budget-table th { text-align: left; color: var(--text-muted); font-weight: 600; white-space: nowrap; font-size: 12px; }
.sortable { cursor: pointer; user-select: none; }
.sort-head { display: inline-flex; align-items: center; gap: 4px; }
.sort-head .n-data-table-sorter {
  height: 12px;
  width: 12px;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}
.sort-head .n-data-table-sorter :deep(.n-base-icon) {
  transition: transform 0.2s;
}
.sort-head .n-data-table-sorter--asc :deep(.n-base-icon) {
  transform: rotate(-180deg);
}
.sort-head .n-data-table-sorter--desc :deep(.n-base-icon) {
  transform: rotate(0deg);
}
.sortable:hover .n-data-table-sorter,
.sort-head .n-data-table-sorter--asc,
.sort-head .n-data-table-sorter--desc {
  opacity: 1;
}
.sort-head .n-data-table-sorter--asc,
.sort-head .n-data-table-sorter--desc {
  color: var(--text-color);
}
:deep(.expense-action-label) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
:deep(.expense-action-label .n-icon) {
  margin-right: 2px;
}
:deep(.expense-action-label.is-edit) {
  color: var(--text-color);
}
:deep(.expense-action-label.is-delete) {
  color: var(--text-color);
}
:deep(.n-dropdown-option-body:hover .expense-action-label.is-delete),
:deep(.n-dropdown-option-body--pending .expense-action-label.is-delete),
:deep(.n-dropdown-option-body--active .expense-action-label.is-delete) {
  color: var(--error-color, #d03050);
}
.emoji-cell { font-size: 18px; width: 48px; text-align: center; }
.editor-row { background: var(--bg-subtle); padding: 12px; }
.edit-grid { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
