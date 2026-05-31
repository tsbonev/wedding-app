import { ref, computed, toRaw } from 'vue'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useProgrammeStore } from '@/stores/useProgrammeStore'
import { useBudgetStore } from '@/stores/useBudgetStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { applySnapshotData } from '@/composables/useStateSnapshot'
import type { WeddingSnapshot } from '@/types'

const COLLECTION = 'snapshots'
const MAX_TODAY = 5
const MAX_PAST_DAYS = 5

// Shared across all useCloudSync() calls
const latestSyncedJson = ref<string | null>(null)

function normalizeForCompare(s: WeddingSnapshot): string {
  const { exportedAt, version, ...rest } = s
  // Recursively sort object keys to ensure consistent stringification
  return JSON.stringify(sortObjectKeys(rest))
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  // Use toRaw to ensure we are working with the actual object if it's a proxy
  const rawObj = toRaw(obj)
  return Object.keys(rawObj)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = sortObjectKeys(rawObj[key])
      return acc
    }, {})
}

export interface CloudSnapshot {
  id: string
  savedAt: Date
  savedBy: string
  snapshot: WeddingSnapshot
}

export function useCloudSync() {
  const isSaving = ref(false)
  const lastSavedAt = ref<Date | null>(null)

  function buildSnapshot(): WeddingSnapshot {
    const guestStore = useGuestStore()
    const seatingStore = useSeatingStore()
    const roomStore = useRoomStore()
    const menuStore = useMenuStore()
    const groupStore = useGroupStore()
    const programmeStore = useProgrammeStore()
    const budgetStore = useBudgetStore()
    const configStore = useAppConfigStore()

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      config: {
        coupleName: configStore.coupleName,
        weddingDate: configStore.weddingDate,
        venue: configStore.venue,
        currency: configStore.currency,
        guestSidebarWidth: configStore.guestSidebarWidth,
        showBudgetOnDashboard: configStore.showBudgetOnDashboard,
      },
      guests: guestStore.guests,
      tables: seatingStore.tables,
      rooms: roomStore.rooms,
      roomTypes: roomStore.roomTypes,
      roomGlobalCheckIn: roomStore.globalCheckIn,
      roomGlobalCheckOut: roomStore.globalCheckOut,
      roomPricingMode: roomStore.roomPricingMode,
      roomAveragePrice: roomStore.averageRoomPrice,
      menuOptions: menuStore.menuOptions,
      groups: groupStore.groups,
      programme: programmeStore.events,
      budgetExpenses: budgetStore.expenses,
    }
  }

  async function pruneSnapshots(): Promise<void> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'))
    const snap = await getDocs(q)

    const todayStr = new Date().toISOString().slice(0, 10)
    let todayCount = 0
    const keptPastDays = new Set<string>()
    const toDelete: string[] = []

    for (const d of snap.docs) {
      const savedAt = (d.data().savedAt as Timestamp)?.toDate() ?? new Date(0)
      const dayStr = savedAt.toISOString().slice(0, 10)

      if (dayStr === todayStr) {
        todayCount++
        if (todayCount > MAX_TODAY) toDelete.push(d.id)
      } else {
        if (!keptPastDays.has(dayStr) && keptPastDays.size < MAX_PAST_DAYS) {
          keptPastDays.add(dayStr)
        } else {
          toDelete.push(d.id)
        }
      }
    }

    await Promise.all(toDelete.map((id) => deleteDoc(doc(db, COLLECTION, id))))
  }

  async function saveSnapshot(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user) return
    isSaving.value = true
    try {
      const snapshot = buildSnapshot()
      // Use JSON.parse(JSON.stringify(snapshot)) to ensure we have a clean, non-reactive object for Firestore
      const cleanSnapshot = JSON.parse(JSON.stringify(snapshot))
      await addDoc(collection(db, COLLECTION), {
        snapshot: cleanSnapshot,
        savedAt: serverTimestamp(),
        savedBy: authStore.user.email ?? authStore.user.uid,
      })
      lastSavedAt.value = new Date()
      latestSyncedJson.value = normalizeForCompare(snapshot)
      await pruneSnapshots()
    } finally {
      isSaving.value = false
    }
  }

  async function loadLatestSnapshot(): Promise<boolean> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) {
      // No snapshots yet, treat current state as synced if user is logged in
      const authStore = useAuthStore()
      if (authStore.user) {
        latestSyncedJson.value = normalizeForCompare(buildSnapshot())
      }
      return false
    }
    const data = snap.docs[0].data()
    const loaded = data.snapshot as WeddingSnapshot
    applySnapshotData(loaded)
    latestSyncedJson.value = normalizeForCompare(loaded)
    return true
  }

  async function listSnapshots(): Promise<CloudSnapshot[]> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'), limit(MAX_TODAY + MAX_PAST_DAYS))
    const snap = await getDocs(q)
    return snap.docs.map((d) => {
      const data = d.data()
      const savedAt = (data.savedAt as Timestamp)?.toDate() ?? new Date(0)
      return {
        id: d.id,
        savedAt,
        savedBy: data.savedBy ?? '',
        snapshot: data.snapshot as WeddingSnapshot,
      }
    })
  }

  function restoreSnapshot(snapshot: WeddingSnapshot): void {
    applySnapshotData(snapshot)
    latestSyncedJson.value = normalizeForCompare(snapshot)
  }

  function resetSyncState(): void {
    latestSyncedJson.value = null
  }

  const hasUnsavedChanges = computed(() => {
    if (!latestSyncedJson.value) return false
    const snapshot = buildSnapshot()
    const current = normalizeForCompare(snapshot)
    return current !== latestSyncedJson.value
  })

  return {
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    latestSyncedJson,
    saveSnapshot,
    loadLatestSnapshot,
    listSnapshots,
    restoreSnapshot,
    resetSyncState,
  }
}
