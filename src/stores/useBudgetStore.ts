import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BudgetExpense } from '@/types'

export const useBudgetStore = defineStore('budget', () => {
  const expenses = ref<BudgetExpense[]>([])

  const getById = (id: string) => expenses.value.find((e) => e.id === id)

  function normalizeExpense(expense: BudgetExpense): BudgetExpense {
    const type = expense.type === 'plates' || expense.type === 'rooms' ? expense.type : 'manual'
    return {
      ...expense,
      iconEmoji: expense.iconEmoji ?? null,
      type,
      plannedAmount: typeof expense.plannedAmount === 'number' ? expense.plannedAmount : 0,
      paidAmount: typeof expense.paidAmount === 'number' ? expense.paidAmount : 0,
      finalAmount: typeof expense.finalAmount === 'number' ? expense.finalAmount : null,
      adultPlatePrice: typeof expense.adultPlatePrice === 'number' ? expense.adultPlatePrice : 0,
      childPlatePrice: typeof expense.childPlatePrice === 'number' ? expense.childPlatePrice : 0,
      platePricingMode: expense.platePricingMode === 'meal-prices' ? 'meal-prices' : 'adult-child',
      linkToSeatedGuests: expense.linkToSeatedGuests ?? true,
      manualAdultCount: typeof expense.manualAdultCount === 'number' ? expense.manualAdultCount : 0,
      manualChildCount: typeof expense.manualChildCount === 'number' ? expense.manualChildCount : 0,
      roomPricingMode: expense.roomPricingMode === 'average' ? 'average' : 'per-room',
      roomsOccupancyMode: expense.roomsOccupancyMode === 'all' ? 'all' : 'occupied',
      averageRoomPriceOverride: typeof expense.averageRoomPriceOverride === 'number' ? expense.averageRoomPriceOverride : 0,
    }
  }

  function addExpense(payload: Omit<BudgetExpense, 'id'>) {
    const created: BudgetExpense = {
      ...payload,
      id: crypto.randomUUID(),
    }
    expenses.value.push(normalizeExpense(created))
  }

  function updateExpense(id: string, patch: Partial<BudgetExpense>) {
    const idx = expenses.value.findIndex((e) => e.id === id)
    if (idx !== -1) {
      expenses.value[idx] = normalizeExpense({ ...expenses.value[idx], ...patch })
    }
  }

  function removeExpense(id: string) {
    expenses.value = expenses.value.filter((e) => e.id !== id)
  }

  function bulkReplace(list: BudgetExpense[]) {
    expenses.value = list.map(normalizeExpense)
  }

  return {
    expenses,
    getById,
    addExpense,
    updateExpense,
    removeExpense,
    bulkReplace,
  }
}, { persist: true })
