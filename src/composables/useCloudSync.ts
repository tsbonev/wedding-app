import { ref } from 'vue'
import { toRaw } from 'vue'
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
const MAX_SNAPSHOTS = 5

export interface CloudSnapshot {
  id: string
  savedAt: Date
  savedBy: string
  snapshot: WeddingSnapshot
}

export function useCloudSync() {
  const isSaving = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

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
        coupleName: toRaw(configStore.coupleName),
        weddingDate: toRaw(configStore.weddingDate),
        venue: toRaw(configStore.venue),
        currency: toRaw(configStore.currency),
        guestSidebarWidth: toRaw(configStore.guestSidebarWidth),
        showBudgetOnDashboard: toRaw(configStore.showBudgetOnDashboard),
      },
      guests: toRaw(guestStore.guests),
      tables: toRaw(seatingStore.tables),
      rooms: toRaw(roomStore.rooms),
      roomTypes: toRaw(roomStore.roomTypes),
      roomGlobalCheckIn: toRaw(roomStore.globalCheckIn),
      roomGlobalCheckOut: toRaw(roomStore.globalCheckOut),
      roomPricingMode: toRaw(roomStore.roomPricingMode),
      roomAveragePrice: toRaw(roomStore.averageRoomPrice),
      menuOptions: toRaw(menuStore.menuOptions),
      groups: toRaw(groupStore.groups),
      programme: toRaw(programmeStore.events),
      budgetExpenses: toRaw(budgetStore.expenses),
    }
  }

  async function pruneOldSnapshots(): Promise<void> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'))
    const snap = await getDocs(q)
    const toDelete = snap.docs.slice(MAX_SNAPSHOTS)
    await Promise.all(toDelete.map((d) => deleteDoc(doc(db, COLLECTION, d.id))))
  }

  async function saveSnapshot(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user) return
    isSaving.value = true
    try {
      const snapshot = buildSnapshot()
      await addDoc(collection(db, COLLECTION), {
        snapshot,
        savedAt: serverTimestamp(),
        savedBy: authStore.user.email ?? authStore.user.uid,
      })
      lastSavedAt.value = new Date()
      await pruneOldSnapshots()
    } finally {
      isSaving.value = false
    }
  }

  async function loadLatestSnapshot(): Promise<boolean> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return false
    const data = snap.docs[0].data()
    applySnapshotData(data.snapshot as WeddingSnapshot)
    return true
  }

  async function listSnapshots(): Promise<CloudSnapshot[]> {
    const q = query(collection(db, COLLECTION), orderBy('savedAt', 'desc'), limit(MAX_SNAPSHOTS))
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
  }

  function startAutoSave(intervalMs = 45_000): void {
    if (autoSaveTimer !== null) return
    autoSaveTimer = setInterval(() => {
      const authStore = useAuthStore()
      if (authStore.user) saveSnapshot()
    }, intervalMs)
  }

  function stopAutoSave(): void {
    if (autoSaveTimer !== null) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  return {
    isSaving,
    lastSavedAt,
    saveSnapshot,
    loadLatestSnapshot,
    listSnapshots,
    restoreSnapshot,
    startAutoSave,
    stopAutoSave,
  }
}
